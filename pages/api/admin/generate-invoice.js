 // pages/api/admin/generate-invoice.js
// Generates a PDF invoice with professional logo and correct Arabic (RTL + shaping)
// Protected by ADMIN_SECRET env var.

import { db } from '../../../lib/firebase-admin';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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

  // ---------- Arabic RTL helpers (never crash) ----------
  let rtl = (s) => String(s || '');
  let hasArabicSupport = false;

  try {
    // bidi-js can be either a factory fn or module with a default
    const bidiMod = require('bidi-js');
    const bidiFactory =
      (typeof bidiMod === 'function' && bidiMod) ||
      (typeof bidiMod?.default === 'function' && bidiMod.default) ||
      null;

    const bidi = bidiFactory ? bidiFactory() : null;

    // arabic-text-shaper export shape differs across builds
    const shaperMod = require('arabic-text-shaper');
    const reshapeFn =
      shaperMod?.reshape ||
      shaperMod?.default?.reshape ||
      (typeof shaperMod === 'function' ? shaperMod : null);

    if (bidi && typeof bidi.fromString === 'function' && typeof reshapeFn === 'function') {
      rtl = (s) => {
        const raw = String(s || '');
        const shaped = reshapeFn(raw);
        // writeReordered gives visually-correct string for PDFKit
        return bidi.fromString(shaped).writeReordered();
      };
      hasArabicSupport = true;
    }
  } catch (e) {
    // deps missing or incompatible -> keep fallback rtl() that won't crash
    console.warn('Arabic shaping not enabled:', e?.message || e);
  }

  // ---------- Fonts (never crash) ----------
  const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf');
  const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Amiri-Bold.ttf');
  const hasArabicFonts = fs.existsSync(fontRegularPath) && fs.existsSync(fontBoldPath);

  try {
    // Fetch order from Firestore
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });

    const data = doc.data();

    // Transform order data
    const customer = {
      name: data.customerName || data.customer?.name || 'Unknown',
      phone: data.customerPhone || data.customer?.phone || 'N/A',
      address: data.customerAddress || data.customer?.address || 'N/A',
      notes: data.note || data.notes || data.customer?.notes || '',
    };

    const items = (data.items || []).map((item) => ({
      name: item.productName || item.name || 'Product',
      qty: item.quantity || item.qty || 1,
      price: item.priceEach || item.price || 0,
      unit: item.unit || '',
    }));

    const orderDate =
      data.createdAt?.toDate?.() || (data.timestamp ? new Date(data.timestamp) : new Date());

    // Create PDF
    const pdfDoc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      compress: true,
    });

    // Register Arabic fonts if present
    if (hasArabicFonts) {
      pdfDoc.registerFont('Amiri', fontRegularPath);
      pdfDoc.registerFont('Amiri-Bold', fontBoldPath);
    }

    // Response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Invoice-${doc.id.slice(-6).toUpperCase()}.pdf"`
    );

    pdfDoc.pipe(res);

    // Colors
    const greenDark = '#1E3D2F';
    const greenMid = '#2A6041';
    const greenLight = '#4A9B6F';
    const greenPale = '#E8F5EE';
    const gold = '#C8790A';
    const gray = '#4A4A4A';
    const lightGray = '#8A8A8A';

    // ===== LOGO DESIGN =====
    const logoX = 50;
    const logoY = 45;
    const logoSize = 70;

    pdfDoc
      .circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2)
      .fillColor(greenDark)
      .fill();

    pdfDoc
      .circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 5)
      .fillColor(greenMid)
      .fill();

    pdfDoc
      .moveTo(logoX + logoSize / 2, logoY + logoSize / 2 + 15)
      .lineTo(logoX + logoSize / 2, logoY + logoSize / 2 - 20)
      .strokeColor('white')
      .lineWidth(3)
      .stroke();

    // leaf right
    pdfDoc
      .moveTo(logoX + logoSize / 2, logoY + logoSize / 2 - 20)
      .bezierCurveTo(
        logoX + logoSize / 2 + 15,
        logoY + logoSize / 2 - 15,
        logoX + logoSize / 2 + 20,
        logoY + logoSize / 2,
        logoX + logoSize / 2,
        logoY + logoSize / 2 + 10
      )
      .fillColor('white')
      .fill();

    // leaf left
    pdfDoc
      .moveTo(logoX + logoSize / 2, logoY + logoSize / 2 - 20)
      .bezierCurveTo(
        logoX + logoSize / 2 - 15,
        logoY + logoSize / 2 - 15,
        logoX + logoSize / 2 - 20,
        logoY + logoSize / 2,
        logoX + logoSize / 2,
        logoY + logoSize / 2 + 10
      )
      .fillColor('white')
      .fill();

    // dots
    const dots = 8;
    for (let i = 0; i < dots; i++) {
      const angle = (i / dots) * Math.PI * 2;
      const dotX = logoX + logoSize / 2 + Math.cos(angle) * (logoSize / 2 + 8);
      const dotY = logoY + logoSize / 2 + Math.sin(angle) * (logoSize / 2 + 8);
      pdfDoc.circle(dotX, dotY, 2).fillColor(greenLight).fill();
    }

    // ===== BRAND NAME =====
    const textX = logoX + logoSize + 20;

    // Arabic brand: مواسم الخير
    // Only render Arabic using Arabic fonts + shaping; otherwise show transliteration to avoid broken output.
    if (hasArabicFonts && hasArabicSupport) {
      pdfDoc.font('Amiri-Bold').fontSize(26).fillColor(greenDark).text(rtl('مواسم الخير'), textX, logoY + 6);
      pdfDoc.font('Helvetica-Bold').fontSize(11).fillColor(greenMid).text('Mawasem Alkhair', textX, logoY + 42);
    } else {
      pdfDoc.font('Helvetica-Bold').fontSize(22).fillColor(greenDark).text('Mawasem Alkhair', textX, logoY + 12);
    }

    pdfDoc
      .fontSize(9)
      .fillColor(greenLight)
      .font('Helvetica')
      .text('Organic Products & Natural Foods', textX, logoY + 62);

    // line
    const lineY = logoY + logoSize + 15;
    for (let i = 0; i < 3; i++) {
      const opacity = 0.3 - i * 0.1;
      pdfDoc
        .moveTo(50, lineY + i)
        .lineTo(545, lineY + i)
        .strokeColor(greenPale)
        .opacity(1 - opacity)
        .lineWidth(1)
        .stroke();
    }
    pdfDoc.opacity(1);

    let yPos = lineY + 25;

    // ===== INVOICE INFO BOX =====
    pdfDoc.roundedRect(50, yPos, 495, 65, 10).fillColor('#F8F6F1').fill();

    pdfDoc.fontSize(20).fillColor(greenDark).font('Helvetica-Bold').text('INVOICE', 65, yPos + 15);

    pdfDoc.roundedRect(380, yPos + 12, 150, 30, 6).fillColor(gold).fill();
    pdfDoc
      .fontSize(18)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text(`#${doc.id.slice(-6).toUpperCase()}`, 380, yPos + 20, { width: 150, align: 'center' });

    pdfDoc
      .fontSize(10)
      .fillColor(gray)
      .font('Helvetica')
      .text(
        `📅 ${orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
        380,
        yPos + 50,
        { width: 150, align: 'center' }
      );

    const statusEmoji = { new: '🆕', confirmed: '✅', preparing: '👨‍🍳', delivered: '📦', cancelled: '❌' };
    const statusText = (data.status || 'new').toLowerCase();
    const emoji = statusEmoji[statusText] || '📋';

    pdfDoc.text(`${emoji} ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`, 65, yPos + 50);

    yPos += 85;

    // ===== CUSTOMER SECTION =====
    pdfDoc.roundedRect(50, yPos, 495, 32, 8).fillColor(greenDark).fill();
    pdfDoc.fontSize(13).fillColor('white').font('Helvetica-Bold').text('👤 Bill To', 65, yPos + 10);

    yPos += 42;

    pdfDoc
      .roundedRect(50, yPos, 495, customer.notes ? 90 : 70, 8)
      .strokeColor('#E2DDD5')
      .lineWidth(1)
      .stroke();

    const detailsY = yPos + 15;

    pdfDoc.fontSize(10).fillColor(greenDark).font('Helvetica-Bold').text('Name:', 65, detailsY);
    pdfDoc.fillColor(gray).font('Helvetica').text(customer.name, 120, detailsY);

    pdfDoc.fillColor(greenDark).font('Helvetica-Bold').text('Phone:', 65, detailsY + 18);
    pdfDoc.fillColor(gray).font('Helvetica').text(customer.phone, 120, detailsY + 18);

    pdfDoc.fillColor(greenDark).font('Helvetica-Bold').text('Address:', 65, detailsY + 36);
    pdfDoc.fillColor(gray).font('Helvetica').text(customer.address, 120, detailsY + 36, { width: 410 });

    if (customer.notes) {
      pdfDoc.fillColor(greenDark).font('Helvetica-Bold').text('Notes:', 65, detailsY + 54);
      pdfDoc.fillColor(gray).font('Helvetica').text(customer.notes, 120, detailsY + 54, { width: 410 });
    }

    yPos += customer.notes ? 110 : 90;

    // ===== ITEMS TABLE =====
    pdfDoc.roundedRect(50, yPos, 495, 32, 8).fillColor(greenDark).fill();
    pdfDoc.fontSize(13).fillColor('white').font('Helvetica-Bold').text('📦 Order Items', 65, yPos + 10);
    yPos += 42;

    pdfDoc.roundedRect(50, yPos, 495, 28, 6).fillColor(greenMid).fill();
    pdfDoc.fontSize(11).fillColor('white').font('Helvetica-Bold');
    pdfDoc
      .text('Item', 60, yPos + 9)
      .text('Qty', 320, yPos + 9, { width: 40, align: 'right' })
      .text('Unit Price', 370, yPos + 9, { width: 70, align: 'right' })
      .text('Total', 450, yPos + 9, { width: 85, align: 'right' });
    yPos += 28;

    pdfDoc.fontSize(10).fillColor(gray).font('Helvetica');

    items.forEach((item, i) => {
      const bgColor = i % 2 === 0 ? '#FFFFFF' : '#F8F6F1';
      pdfDoc.roundedRect(50, yPos, 495, 26, 4).fillColor(bgColor).fill();

      const itemName = item.unit ? `${item.name} (${item.unit})` : item.name;

      pdfDoc
        .fillColor(gray)
        .text(itemName, 60, yPos + 9, { width: 250 })
        .text(String(item.qty), 320, yPos + 9, { width: 40, align: 'right' })
        .text(`€${Number(item.price || 0).toFixed(2)}`, 370, yPos + 9, { width: 70, align: 'right' })
        .fillColor(greenDark)
        .font('Helvetica-Bold')
        .text(`€${(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}`, 450, yPos + 9, {
          width: 85,
          align: 'right',
        });

      pdfDoc.font('Helvetica');
      yPos += 26;
    });

    // ===== TOTALS =====
    yPos += 20;

    const computedTotal = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0);
    const total = typeof data.total === 'number' ? data.total : computedTotal;

    pdfDoc.roundedRect(340, yPos, 205, 90, 10).fillColor('#F8F6F1').fill();

    pdfDoc
      .fontSize(11)
      .fillColor(gray)
      .font('Helvetica')
      .text('Subtotal:', 360, yPos + 15, { width: 80, align: 'left' })
      .text(`€${total.toFixed(2)}`, 450, yPos + 15, { width: 85, align: 'right' });

    pdfDoc
      .text('Tax (0%):', 360, yPos + 35, { width: 80, align: 'left' })
      .text('€0.00', 450, yPos + 35, { width: 85, align: 'right' });

    pdfDoc.roundedRect(350, yPos + 55, 185, 28, 6).fillColor(greenDark).fill();
    pdfDoc
      .fontSize(14)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text('TOTAL:', 365, yPos + 63, { width: 80, align: 'left' })
      .fontSize(16)
      .text(`€${total.toFixed(2)}`, 450, yPos + 62, { width: 75, align: 'right' });

    // ===== FOOTER =====
    yPos += 110;

    pdfDoc.roundedRect(50, yPos, 250, 28, 6).fillColor(greenPale).fill();
    pdfDoc
      .fontSize(10)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text(
        `💳 ${(data.paymentMethod || 'cash_on_delivery')
          .replace(/_/g, ' ')
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')}`,
        65,
        yPos + 9
      );

    yPos += 50;

    if (hasArabicFonts && hasArabicSupport) {
      pdfDoc
        .fontSize(14)
        .fillColor(greenDark)
        .font('Amiri-Bold')
        .text(rtl('شكراً لاختياركم مواسم الخير! 🌿'), 50, yPos, { align: 'center', width: 495 });
    }

    yPos += 22;

    pdfDoc
      .fontSize(11)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Thank you for choosing Mawasem Alkhair!', 50, yPos, { align: 'center', width: 495 });

    yPos += 18;

    pdfDoc
      .fontSize(9)
      .fillColor(lightGray)
      .font('Helvetica')
      .text('For inquiries, contact us via WhatsApp or phone', 50, yPos, { align: 'center', width: 495 });

    pdfDoc.end();
  } catch (err) {
    console.error('Invoice generation error:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to generate invoice',
        details: err?.message || String(err),
      });
    }
  }
}