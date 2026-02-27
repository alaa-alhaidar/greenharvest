// pages/api/admin/generate-invoice.js
// Generates a PDF invoice with professional logo + correct Arabic RTL rendering
// Protected by ADMIN_SECRET env var.
//
// Requires:
//   npm i bidi-js arabic-text-shaper
// And font files placed at:
//   /public/fonts/Amiri-Regular.ttf
//   /public/fonts/Amiri-Bold.ttf

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

  // Lazy-require (keeps Next/Vercel bundling happier)
  let bidi;
  let arabicShaper;
  try {
    const bidiFactory = require('bidi-js');
    bidi = typeof bidiFactory === 'function' ? bidiFactory() : bidiFactory;
    arabicShaper = require('arabic-text-shaper');
  } catch (e) {
    console.error('Missing Arabic shaping deps:', e);
    return res.status(500).json({
      error: 'Missing dependencies for Arabic rendering',
      details: 'Run: npm i bidi-js arabic-text-shaper',
    });
  }

  // RTL helper: Arabic shaping + BiDi reordering
  function rtl(str) {
    if (!str) return '';
    try {
      const shaped = arabicShaper.reshape(String(str));
      // bidi-js API: fromString().writeReordered() is the common usage
      return bidi.fromString(shaped).writeReordered();
    } catch {
      return String(str);
    }
  }

  // Font paths (embedded)
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

    // Register Arabic fonts (if present)
    if (hasArabicFonts) {
      pdfDoc.registerFont('Amiri', fontRegularPath);
      pdfDoc.registerFont('Amiri-Bold', fontBoldPath);
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="MawasemAlKhair-Invoice-${doc.id.slice(-6).toUpperCase()}.pdf"`
    );

    // Pipe PDF to response
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

    // Main circular logo background
    pdfDoc
      .circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2)
      .fillColor(greenDark)
      .fill();

    // Inner circle
    pdfDoc
      .circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 5)
      .fillColor(greenMid)
      .fill();

    // Leaf stem
    pdfDoc
      .moveTo(logoX + logoSize / 2, logoY + logoSize / 2 + 15)
      .lineTo(logoX + logoSize / 2, logoY + logoSize / 2 - 20)
      .strokeColor('white')
      .lineWidth(3)
      .stroke();

    // Leaf (right)
    pdfDoc.save();
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
    pdfDoc.restore();

    // Leaf (left)
    pdfDoc.save();
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
    pdfDoc.restore();

    // Decorative dots
    const dots = 8;
    for (let i = 0; i < dots; i++) {
      const angle = (i / dots) * Math.PI * 2;
      const dotX = logoX + logoSize / 2 + Math.cos(angle) * (logoSize / 2 + 8);
      const dotY = logoY + logoSize / 2 + Math.sin(angle) * (logoSize / 2 + 8);
      pdfDoc.circle(dotX, dotY, 2).fillColor(greenLight).fill();
    }

    // ===== BRAND NAME (Arabic primary) =====
    const textX = logoX + logoSize + 20;

    // Arabic brand (مواسم الخير) — correct RTL shaping
    if (hasArabicFonts) {
      pdfDoc
        .fontSize(26)
        .fillColor(greenDark)
        .font('Amiri-Bold')
        .text(rtl('مواسم الخير'), textX, logoY + 6, { width: 475 - (textX - 50), align: 'left' });

      // Optional English small (kept subtle)
      pdfDoc
        .fontSize(11)
        .fillColor(greenMid)
        .font('Helvetica-Bold')
        .text('Mawasem Alkhair', textX, logoY + 42);
    } else {
      // Fallback if fonts missing (Arabic may still not render correctly)
      pdfDoc
        .fontSize(22)
        .fillColor(greenDark)
        .font('Helvetica-Bold')
        .text('Mawasem Alkhair', textX, logoY + 10);
    }

    // Tagline
    pdfDoc
      .fontSize(9)
      .fillColor(greenLight)
      .font('Helvetica')
      .text('Organic Products & Natural Foods', textX, logoY + 62);

    // Decorative line
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
        `📅 ${orderDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}`,
        380,
        yPos + 50,
        { width: 150, align: 'center' }
      );

    const statusEmoji = {
      new: '🆕',
      confirmed: '✅',
      preparing: '👨‍🍳',
      delivered: '📦',
      cancelled: '❌',
    };
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

    pdfDoc
      .fontSize(10)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Name:', 65, detailsY)
      .fillColor(gray)
      .font('Helvetica')
      .text(customer.name, 120, detailsY);

    pdfDoc
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Phone:', 65, detailsY + 18)
      .fillColor(gray)
      .font('Helvetica')
      .text(customer.phone, 120, detailsY + 18);

    pdfDoc
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Address:', 65, detailsY + 36)
      .fillColor(gray)
      .font('Helvetica')
      .text(customer.address, 120, detailsY + 36, { width: 410 });

    if (customer.notes) {
      pdfDoc
        .fillColor(greenDark)
        .font('Helvetica-Bold')
        .text('Notes:', 65, detailsY + 54)
        .fillColor(gray)
        .font('Helvetica')
        .text(customer.notes, 120, detailsY + 54, { width: 410 });
    }

    yPos += customer.notes ? 110 : 90;

    // ===== ITEMS TABLE =====
    pdfDoc.roundedRect(50, yPos, 495, 32, 8).fillColor(greenDark).fill();
    pdfDoc.fontSize(13).fillColor('white').font('Helvetica-Bold').text('📦 Order Items', 65, yPos + 10);

    yPos += 42;

    pdfDoc.fontSize(11).fillColor('white').font('Helvetica-Bold');
    pdfDoc.roundedRect(50, yPos, 495, 28, 6).fillColor(greenMid).fill();

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
    const total =
      typeof data.total === 'number'
        ? data.total
        : items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0);

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

    // Arabic thank-you (correct RTL shaping)
    if (hasArabicFonts) {
      pdfDoc
        .fontSize(14)
        .fillColor(greenDark)
        .font('Amiri-Bold')
        .text(rtl('شكراً لاختياركم مواسم الخير! 🌿'), 50, yPos, { align: 'center', width: 495 });
    } else {
      pdfDoc
        .fontSize(12)
        .fillColor(greenDark)
        .font('Helvetica-Bold')
        .text('Thank you!', 50, yPos, { align: 'center', width: 495 });
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
        details: err.message,
      });
    }
  }
}