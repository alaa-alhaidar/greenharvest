// pages/api/admin/generate-invoice.js
// Arabic-only PDF invoice with olive branch logo (RTL + shaping)
// Protected by ADMIN_SECRET env var.
//
// Requires:
//   npm i bidi-js arabic-persian-reshaper
// Fonts:
//   public/fonts/Amiri-Regular.ttf
//   public/fonts/Amiri-Bold.ttf

import { db } from '../../../lib/firebase-admin';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== 'string') {
    return res.status(422).json({ error: 'Invalid order ID' });
  }

  // --- Arabic shaping + bidi (required for PDFKit) ---
  let bidi;
  let reshapeFn;
  try {
    const bidiMod = require('bidi-js');
    const bidiFactory =
      (typeof bidiMod === 'function' && bidiMod) ||
      (typeof bidiMod?.default === 'function' && bidiMod.default);
    bidi = bidiFactory();

    const reshaper = require('arabic-persian-reshaper');
    reshapeFn =
      reshaper?.reshape ||
      reshaper?.default?.reshape ||
      (typeof reshaper === 'function' ? reshaper : null);

    if (typeof reshapeFn !== 'function') throw new Error('arabic reshaper not found');
  } catch (e) {
    // Without these, Arabic will not render correctly in PDFKit
    return res.status(500).json({
      error: 'Arabic shaping deps missing',
      details: 'Install: npm i bidi-js arabic-persian-reshaper',
    });
  }

  const rtl = (s) => bidi.fromString(reshapeFn(String(s ?? ''))).writeReordered();

  // --- Fonts ---
  const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf');
  const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Amiri-Bold.ttf');
  if (!fs.existsSync(fontRegularPath) || !fs.existsSync(fontBoldPath)) {
    return res.status(500).json({
      error: 'Arabic fonts missing',
      details: 'Add: public/fonts/Amiri-Regular.ttf and public/fonts/Amiri-Bold.ttf',
    });
  }

  try {
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });

    const data = doc.data();

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

    const computedTotal = items.reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.qty || 0),
      0
    );
    const total = typeof data.total === 'number' ? data.total : computedTotal;

    // --- PDF ---
    const pdfDoc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Register Arabic fonts
    pdfDoc.registerFont('Amiri', fontRegularPath);
    pdfDoc.registerFont('Amiri-Bold', fontBoldPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="فاتورة-${invoiceNumber}.pdf"`
    );
    pdfDoc.pipe(res);

    // Colors
    const green = '#2A6041';
    const black = '#000000';
    const gray = '#333333';
    const medGray = '#666666';
    const lightGray = '#999999';
    const border = '#CCCCCC';

    // Helpers
    const pageLeft = 50;
    const pageRight = 545; // A4 width (595) - right margin (50)
    const contentW = pageRight - pageLeft;

    // RTL text helper (right aligned blocks)
    const rtext = (txt, x, y, w, opts = {}) =>
      pdfDoc.text(rtl(txt), x, y, { width: w, align: 'right', ...opts });

    const fmtEUR = (n) => `€${Number(n || 0).toFixed(2)}`;

    let y = 45;
    const logoSize = 55;

    // ---------- LOGO (olive branch) on RIGHT ----------
    const logoX = pageRight - logoSize;

    pdfDoc
      .circle(logoX + logoSize / 2, y + logoSize / 2, logoSize / 2)
      .strokeColor(green)
      .lineWidth(2.5)
      .stroke();

    pdfDoc
      .moveTo(logoX + logoSize / 2 - 15, y + logoSize / 2 + 15)
      .bezierCurveTo(
        logoX + logoSize / 2 - 10,
        y + logoSize / 2,
        logoX + logoSize / 2 - 5,
        y + logoSize / 2 - 10,
        logoX + logoSize / 2 + 15,
        y + logoSize / 2 - 15
      )
      .strokeColor(green)
      .lineWidth(2.5)
      .stroke();

    [
      { x: -12, y: 10, angle: -30 },
      { x: -8, y: 5, angle: 30 },
      { x: -4, y: 0, angle: -20 },
      { x: 0, y: -5, angle: 25 },
      { x: 5, y: -8, angle: -25 },
      { x: 10, y: -12, angle: 20 },
    ].forEach((leaf) => {
      pdfDoc.save().translate(logoX + logoSize / 2 + leaf.x, y + logoSize / 2 + leaf.y).rotate(leaf.angle);
      pdfDoc.ellipse(0, 0, 5, 2.5).fillColor(green).fill();
      pdfDoc.restore();
    });

    [{ x: -10, y: 8 }, { x: -2, y: -2 }, { x: 8, y: -10 }].forEach((o) =>
      pdfDoc.circle(logoX + logoSize / 2 + o.x, y + logoSize / 2 + o.y, 2.5).fillColor(green).fill()
    );

    // ---------- COMPANY NAME (Arabic) ----------
    const headerTextX = pageLeft;
    const headerTextW = contentW - (logoSize + 14);

    pdfDoc.font('Amiri-Bold').fontSize(26).fillColor(black);
    rtext('مواسم الخير', headerTextX, y + 2, headerTextW);

    pdfDoc.font('Amiri').fontSize(12).fillColor(gray);
    rtext('منتجات عضوية وأغذية طبيعية', headerTextX, y + 30, headerTextW);

    y += logoSize + 22;
    pdfDoc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(black).lineWidth(2).stroke();
    y += 18;

    // ---------- INVOICE HEADER ----------
    pdfDoc.font('Amiri-Bold').fontSize(24).fillColor(black);
    rtext('فاتورة', pageLeft, y, contentW);

    // Invoice number box on LEFT
    const boxW = 155;
    const boxX = pageLeft;
    const boxY = y - 4;
    pdfDoc.rect(boxX, boxY, boxW, 36).strokeColor(green).lineWidth(2).stroke();
    pdfDoc.font('Amiri-Bold').fontSize(18).fillColor(green);
    pdfDoc.text(`#${invoiceNumber}`, boxX, boxY + 8, { width: boxW, align: 'center' });

    y += 42;

    // Date + Status line (Arabic)
    pdfDoc.font('Amiri').fontSize(11).fillColor(medGray);
    const dateStr = orderDate.toLocaleDateString('ar-SY', { day: 'numeric', month: 'long', year: 'numeric' });
    rtext(`التاريخ: ${dateStr}`, pageLeft, y, contentW);

    const st = statusArabic[status] || 'جديد';
    pdfDoc.text(rtl(`الحالة: ${st}`), pageLeft, y, { width: contentW, align: 'left' }); // status on left for balance
    y += 26;

    // ---------- CUSTOMER ----------
    pdfDoc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(border).lineWidth(1).stroke();
    y += 12;

    pdfDoc.font('Amiri-Bold').fontSize(13).fillColor(black);
    rtext('بيانات العميل', pageLeft, y, contentW);
    y += 18;

    const customerRows = [
      ['الاسم', customer.name],
      ['الهاتف', customer.phone],
      ['العنوان', customer.address],
      ...(customer.notes ? [['ملاحظات', customer.notes]] : []),
    ]