 // pages/api/admin/generate-invoice.js
// Generates Arabic HTML invoice (print to PDF)
// Protected by ADMIN_SECRET env var.

import { db } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin secret
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { orderId } = req.body || {};

  if (!orderId || typeof orderId !== 'string') {
    return res.status(422).json({ error: 'Invalid order ID' });
  }

  try {
    // Fetch order from Firestore
    const doc = await db.collection('orders').doc(orderId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const data = doc.data();
    
    // Transform order data
    const customer = {
      name: data.customerName || data.customer?.name || 'غير معروف',
      phone: data.customerPhone || data.customer?.phone || '-',
      address: data.customerAddress || data.customer?.address || '-',
      notes: data.note || data.notes || data.customer?.notes || ''
    };

    const items = (data.items || []).map(item => ({
      name: item.productName || item.name || 'منتج',
      qty: item.quantity || item.qty || 1,
      price: item.priceEach || item.price || 0,
      unit: item.unit || ''
    }));

    const orderDate = data.createdAt?.toDate?.() 
                      || (data.timestamp ? new Date(data.timestamp) : new Date());
    
    const total = data.total || 0;
    const invoiceNumber = doc.id.slice(-6).toUpperCase();
    const status = (data.status || 'new').toLowerCase();
    
    // Status translations
    const statusArabic = {
      'new': 'جديد',
      'confirmed': 'مؤكد',
      'preparing': 'قيد التحضير',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي'
    };

    // Generate HTML invoice
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>فاتورة ${invoiceNumber}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: Arial, sans-serif;
  direction: rtl;
  padding: 20mm;
  background: white;
}

.invoice {
  max-width: 190mm;
  margin: 0 auto;
  background: white;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 3px solid #2A6041;
}

.logo {
  width: 70px;
  height: 70px;
  border: 3px solid #2A6041;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.logo svg {
  width: 50px;
  height: 50px;
}

.company-info {
  flex: 1;
}

.company-name {
  font-size: 28px;
  font-weight: bold;
  color: #000;
  margin-bottom: 5px;
}

.company-tagline {
  font-size: 14px;
  color: #666;
}

/* Invoice Info */
.invoice-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 25px 0;
  padding: 15px;
  background: #f8f8f8;
  border-radius: 8px;
}

.invoice-title {
  font-size: 24px;
  font-weight: bold;
}

.invoice-number {
  font-size: 20px;
  font-weight: bold;
  color: #2A6041;
  padding: 8px 20px;
  border: 2px solid #2A6041;
  border-radius: 6px;
}

.invoice-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
  font-size: 14px;
  color: #666;
}

/* Customer Section */
.section-title {
  font-size: 16px;
  font-weight: bold;
  margin: 20px 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
}

.customer-details {
  background: #f8f8f8;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.customer-row {
  display: flex;
  padding: 8px 0;
  font-size: 14px;
}

.customer-label {
  font-weight: bold;
  min-width: 80px;
  color: #333;
}

.customer-value {
  color: #666;
}

/* Items Table */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.items-table thead {
  background: #2A6041;
  color: white;
}

.items-table th {
  padding: 12px;
  text-align: right;
  font-weight: bold;
  font-size: 14px;
}

.items-table td {
  padding: 12px;
  text-align: right;
  border-bottom: 1px solid #e0e0e0;
}

.items-table tbody tr:hover {
  background: #f8f8f8;
}

.item-name {
  font-weight: 500;
}

.item-total {
  font-weight: bold;
  color: #000;
}

/* Totals */
.totals {
  margin-top: 30px;
  margin-right: auto;
  max-width: 300px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
}

.total-row.subtotal {
  color: #666;
}

.total-row.final {
  border-top: 2px solid #2A6041;
  margin-top: 10px;
  padding-top: 15px;
  font-size: 18px;
  font-weight: bold;
}

.total-row.final .total-value {
  color: #2A6041;
  background: #f0f8f0;
  padding: 8px 15px;
  border-radius: 6px;
}

/* Payment */
.payment-method {
  margin: 25px 0;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

/* Footer */
.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
  text-align: center;
}

.footer-thanks {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.footer-contact {
  font-size: 13px;
  color: #666;
}

/* Print Styles */
@media print {
  body {
    padding: 0;
  }
  
  .no-print {
    display: none !important;
  }
  
  .invoice {
    max-width: 100%;
  }
}

/* Print Button */
.print-button {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 12px 24px;
  background: #2A6041;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 1000;
}

.print-button:hover {
  background: #1E4030;
}

@media print {
  .print-button {
    display: none;
  }
}
</style>
</head>
<body>

<button class="print-button no-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>

<div class="invoice">
  <!-- Header -->
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
    <div class="company-info">
      <div class="company-name">مواسم الخير</div>
      <div class="company-tagline">منتجات عضوية وأغذية طبيعية</div>
    </div>
  </div>

  <!-- Invoice Info -->
  <div class="invoice-info">
    <div class="invoice-title">فاتورة</div>
    <div class="invoice-number">#${invoiceNumber}</div>
  </div>

  <div class="invoice-details">
    <div>التاريخ: ${orderDate.toLocaleDateString('ar-SY', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    <div>الحالة: ${statusArabic[status] || 'جديد'}</div>
  </div>

  <!-- Customer Details -->
  <div class="section-title">معلومات العميل</div>
  <div class="customer-details">
    <div class="customer-row">
      <div class="customer-label">الاسم:</div>
      <div class="customer-value">${customer.name}</div>
    </div>
    <div class="customer-row">
      <div class="customer-label">الهاتف:</div>
      <div class="customer-value">${customer.phone}</div>
    </div>
    <div class="customer-row">
      <div class="customer-label">العنوان:</div>
      <div class="customer-value">${customer.address}</div>
    </div>
    ${customer.notes ? `<div class="customer-row">
      <div class="customer-label">ملاحظات:</div>
      <div class="customer-value">${customer.notes}</div>
    </div>` : ''}
  </div>

  <!-- Items -->
  <div class="section-title">المنتجات</div>
  <table class="items-table">
    <thead>
      <tr>
        <th>المجموع</th>
        <th>السعر</th>
        <th>الكمية</th>
        <th>المنتج</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => {
        const itemName = item.unit ? `${item.name} (${item.unit})` : item.name;
        const itemTotal = item.price * item.qty;
        return `<tr>
          <td class="item-total">${itemTotal.toFixed(2)} €</td>
          <td>${item.price.toFixed(2)} €</td>
          <td>${item.qty}</td>
          <td class="item-name">${itemName}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="total-row subtotal">
      <span>المجموع الفرعي:</span>
      <span>${total.toFixed(2)} €</span>
    </div>
    <div class="total-row subtotal">
      <span>الضريبة (0%):</span>
      <span>0.00 €</span>
    </div>
    <div class="total-row final">
      <span>المجموع الكلي:</span>
      <span class="total-value">${total.toFixed(2)} €</span>
    </div>
  </div>

  <!-- Payment Method -->
  <div class="payment-method">
    <strong>طريقة الدفع:</strong> الدفع عند الاستلام
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-thanks">شكراً لاختياركم مواسم الخير! 🌿</div>
    <div class="footer-contact">للاستفسار، يرجى التواصل عبر واتساب أو الهاتف</div>
  </div>
</div>

</body>
</html>`;

    // Send HTML response
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);

  } catch (err) {
    console.error('Invoice generation error:', err);
    return res.status(500).json({ 
      error: 'Failed to generate invoice',
      details: err.message
    });
  }
}