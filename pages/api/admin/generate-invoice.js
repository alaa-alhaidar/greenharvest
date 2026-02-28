// pages/api/admin/generate-invoice.js
// Generates Arabic PDF invoice (server-side) using headless Chromium
// Protected by ADMIN_SECRET env var.

import { db } from '../../../lib/firebase-admin';

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Check admin secret
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== 'string') {
    return res.status(422).json({ error: 'Invalid order ID' });
  }

  let browser = null;

  try {
    // Fetch order from Firestore
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });

    const data = doc.data();

    // Transform order data
    const customer = {
      name: data.customerName || data.customer?.name || 'غير معروف',
      phone: data.customerPhone || data.customer?.phone || '-',
      address: data.customerAddress || data.customer?.address || '-',
      notes: data.note || data.notes || data.customer?.notes || '',
    };

    const items = (data.items || []).map((item) => ({
      name: item.productName || item.name || 'منتج',
      qty: item.quantity || item.qty || 1,
      price: item.priceEach || item.price || 0,
      unit: item.unit || '',
    }));

    const orderDate =
      data.createdAt?.toDate?.() || (data.timestamp ? new Date(data.timestamp) : new Date());

    const invoiceNumber = doc.id.slice(-6).toUpperCase();
    const status = (data.status || 'new').toLowerCase();

    const statusArabic = {
      new: 'جديد',
      confirmed: 'مؤكد',
      preparing: 'قيد التحضير',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
    };

    // IMPORTANT: compute total safely
    const computedTotal = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0);
    const total = typeof data.total === 'number' ? data.total : computedTotal;

    // Arabic-only HTML (NO print button)
    // Uses Google Fonts (Cairo) to ensure Arabic shaping renders correctly in Chromium.
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>فاتورة ${invoiceNumber}</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">

<style>
* { margin:0; padding:0; box-sizing:border-box; }

body{
  font-family: "Cairo", Arial, sans-serif;
  direction: rtl;
  background:#fff;
  color:#111;
}

.page{
  width: 210mm;
  min-height: 297mm;
  padding: 18mm 18mm;
}

.header{
  display:flex;
  align-items:center;
  gap:16px;
  padding-bottom:16px;
  border-bottom:3px solid #2A6041;
  margin-bottom:18px;
}

.logo{
  width:68px;
  height:68px;
  border:3px solid #2A6041;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  flex: 0 0 auto;
}

.logo svg{ width:48px; height:48px; }

.company-name{
  font-size:28px;
  font-weight:800;
  line-height:1.1;
}

.company-tagline{
  font-size:14px;
  color:#666;
  margin-top:4px;
}

.invoice-info{
  display:flex;
  justify-content:space-between;
  align-items:center;
  background:#f7f7f7;
  padding:14px 16px;
  border-radius:10px;
  margin: 16px 0 10px;
}

.invoice-title{ font-size:22px; font-weight:800; }
.invoice-number{
  font-size:18px;
  font-weight:800;
  color:#2A6041;
  border:2px solid #2A6041;
  border-radius:8px;
  padding:6px 16px;
}

.meta{
  display:flex;
  justify-content:space-between;
  gap:12px;
  color:#666;
  font-size:13px;
  margin-bottom:14px;
}

.section-title{
  font-size:15px;
  font-weight:800;
  margin:18px 0 10px;
  padding-bottom:8px;
  border-bottom:2px solid #e6e6e6;
}

.card{
  background:#f7f7f7;
  border-radius:10px;
  padding:14px 16px;
}

.row{
  display:flex;
  padding:7px 0;
  font-size:14px;
}
.label{
  font-weight:800;
  min-width:84px;
  color:#222;
}
.value{ color:#555; }

table{
  width:100%;
  border-collapse:collapse;
  margin-top:10px;
}
thead{
  background:#2A6041;
  color:#fff;
}
th, td{
  padding:10px 10px;
  text-align:right;
  font-size:14px;
}
tbody td{
  border-bottom:1px solid #e6e6e6;
}
tbody tr:nth-child(even){
  background:#fafafa;
}
.item-total{
  font-weight:800;
}

.totals{
  margin-top:18px;
  width: 320px;
  margin-right:auto; /* pushes to left in RTL */
}
.total-row{
  display:flex;
  justify-content:space-between;
  padding:8px 0;
  font-size:14px;
  color:#666;
}
.total-row.final{
  border-top:2px solid #2A6041;
  margin-top:8px;
  padding-top:12px;
  font-size:18px;
  color:#111;
  font-weight:800;
}
.total-value{
  color:#2A6041;
  background:#eef7ef;
  padding:6px 12px;
  border-radius:8px;
}

.payment{
  margin-top:16px;
  background:#f7f7f7;
  border-radius:10px;
  padding:10px 12px;
  text-align:center;
  font-size:14px;
}

.footer{
  margin-top:26px;
  border-top:2px solid #e6e6e6;
  padding-top:16px;
  text-align:center;
}
.footer-thanks{
  font-size:16px;
  font-weight:800;
  margin-bottom:6px;
}
.footer-contact{
  font-size:13px;
  color:#666;
}
</style>
</head>

<body>
  <div class="page">
    <div class="header">
      <div class="logo">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="none" stroke="#2A6041" stroke-width="3"/>
          <path d="M 30 70 Q 40 50 40 30 Q 45 25 70 30" fill="none" stroke="#2A6041" stroke-width="3" stroke-linecap="round"/>
          <ellipse cx="32" cy="65" rx="6" ry="3" fill="#2A6041" transform="rotate(-30 32 65)"/>
          <ellipse cx="36" cy="55" rx="6" ry="3" fill="#2A6041" transform="rotate(20 36 55)"/>
          <ellipse cx="38" cy="45" rx="6" ry="3" fill="#2A6041" transform="rotate(-15 38 45)"/>
          <ellipse cx="42" cy="38" rx="6" ry="3" fill="#2A6041" transform="rotate(25 42 38)"/>
          <ellipse cx="50" cy="32" rx="6" ry="3" fill="#2A6041" transform="rotate(-20 50 32)"/>
          <ellipse cx="60" cy="30" rx="6" ry="3" fill="#2A6041" transform="rotate(15 60 30)"/>
          <circle cx="34" cy="60" r="3" fill="#2A6041"/>
          <circle cx="40" cy="42" r="3" fill="#2A6041"/>
          <circle cx="55" cy="32" r="3" fill="#2A6041"/>
        </svg>
      </div>
      <div>
        <div class="company-name">مواسم الخير</div>
        <div class="company-tagline">منتجات عضوية وأغذية طبيعية</div>
      </div>
    </div>

    <div class="invoice-info">
      <div class="invoice-title">فاتورة</div>
      <div class="invoice-number">#${invoiceNumber}</div>
    </div>

    <div class="meta">
      <div>التاريخ: ${orderDate.toLocaleDateString('ar-SY', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div>الحالة: ${statusArabic[status] || 'جديد'}</div>
    </div>

    <div class="section-title">معلومات العميل</div>
    <div class="card">
      <div class="row"><div class="label">الاسم:</div><div class="value">${escapeHtml(customer.name)}</div></div>
      <div class="row"><div class="label">الهاتف:</div><div class="value">${escapeHtml(customer.phone)}</div></div>
      <div class="row"><div class="label">العنوان:</div><div class="value">${escapeHtml(customer.address)}</div></div>
      ${customer.notes ? `<div class="row"><div class="label">ملاحظات:</div><div class="value">${escapeHtml(customer.notes)}</div></div>` : ''}
    </div>

    <div class="section-title">المنتجات</div>
    <table>
      <thead>
        <tr>
          <th>المنتج</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>المجموع</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => {
          const name = item.unit ? `${item.name} (${item.unit})` : item.name;
          const itemTotal = Number(item.price || 0) * Number(item.qty || 0);
          return `
          <tr>
            <td>${escapeHtml(name)}</td>
            <td>${Number(item.qty || 0)}</td>
            <td>€ ${Number(item.price || 0).toFixed(2)}</td>
            <td class="item-total">€ ${itemTotal.toFixed(2)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row"><span>المجموع الفرعي:</span><span>€ ${total.toFixed(2)}</span></div>
      <div class="total-row"><span>الضريبة (0%):</span><span>€ 0.00</span></div>
      <div class="total-row final"><span>المجموع الكلي:</span><span class="total-value">€ ${total.toFixed(2)}</span></div>
    </div>

    <div class="payment"><strong>طريقة الدفع:</strong> الدفع عند الاستلام</div>

    <div class="footer">
      <div class="footer-thanks">شكراً لاختياركم مواسم الخير! 🌿</div>
      <div class="footer-contact">للاستفسار، يرجى التواصل عبر واتساب أو الهاتف</div>
    </div>
  </div>
</body>
</html>`;

    // Launch Chromium (Vercel-safe)
    const isProd = process.env.NODE_ENV === 'production';

    browser = await puppeteer.launch({
      args: isProd ? chromium.args : [],
      defaultViewport: chromium.defaultViewport,
      executablePath: isProd ? await chromium.executablePath() : undefined, // local uses installed Chrome
      headless: isProd ? chromium.headless : true,
    });

    const page = await browser.newPage();

    // Load HTML and wait for fonts
    await page.setContent(html, { waitUntil: ['domcontentloaded', 'networkidle0'] });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    // Return PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="فاتورة-${invoiceNumber}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('Invoice PDF generation error:', err);
    return res.status(500).json({
      error: 'Failed to generate invoice PDF',
      details: err?.message || String(err),
    });
  } finally {
    try {
      if (browser) await browser.close();
    } catch (_) {}
  }
}

// Basic HTML escaping (prevents breaking your HTML if user data contains < > etc.)
function escapeHtml(input) {
  return String(input ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}