// pages/api/admin/generate-invoice.js
// Arabic-only PDF invoice with olive branch logo (RTL + shaping) using PDFKit
// Protected by ADMIN_SECRET env var.
//
// Requires:
//   npm i bidi-js arabic-persian-reshaper
//
// Fonts: optional locally (recommended)
//   public/fonts/Amiri-Regular.ttf
//   public/fonts/Amiri-Bold.ttf
// If missing, this code falls back to downloading Amiri from GitHub at runtime.

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

  // ---------- Arabic shaping (required for Arabic in PDFKit) ----------
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

    if (typeof reshapeFn !== 'function') throw new Error('reshape() not found');
  } catch (e) {
    return res.status(500).json({
      error: 'Arabic shaping dependencies missing',
      details: 'Run: npm i bidi-js arabic-persian-reshaper',
    });
  }

  const rtl = (s) => bidi.fromString(reshapeFn(String(s ?? ''))).writeReordered();

  // ---------- Font loading (local or remote fallback) ----------
  const REG_URL =
    'https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf';
  const BOLD_URL =
    'https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Bold.ttf';

  const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Amiri-Regular.ttf');
  const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Amiri-Bold.ttf');

  async function loadFontBuffer(localPath, remoteUrl) {
    try {
      if (fs.existsSync(localPath)) return fs.readFileSync(localPath);
    } catch (_) {}
    // Remote fallback (works on Vercel)
    const r = await fetch(remoteUrl);
    if (!r.ok) throw new Error(`Failed to download font: ${remoteUrl}`);
    const ab = await r.arrayBuffer();
    return Buffer.from(ab);
  }

  // Cache fonts across invocations (best-effort)
  if (!globalThis.__AMIRI_FONTS__) globalThis.__AMIRI_FONTS__ = {};
  const cache = globalThis.__AMIRI_FONTS__;

  let amiriReg;
  let amiriBold;
  try {
    amiriReg = cache.reg || (cache.reg = await loadFontBuffer(fontRegularPath, REG_URL));
    amiriBold = cache.bold || (cache.bold = await loadFontBuffer(fontBoldPath, BOLD_URL));
  } catch (e) {
    return res.status(500).json({
      error: 'Failed to load Arabic fonts',
      details: e?.message || String(e),
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

    // Create PDF
    const pdfDoc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Register fonts from buffers (works even if files not bundled)
    pdfDoc.registerFont('Amiri', amiriReg);
    pdfDoc.registerFont('Amiri-Bold', amiriBold);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="فاتورة-${invoiceNumber}.pdf"`);
    pdfDoc.pipe(res);

    // Colors
    const green = '#2A6041';
    const black = '#000000';
    const gray = '#333333';
    const medGray = '#666666';
    const lightGray = '#999999';
    const border = '#CCCCCC';

    // Layout helpers
    const pageLeft = 50;
    const pageRight = 545; // 595 - 50
    const contentW = pageRight - pageLeft;

    const rtext = (txt, x, y, w, opts = {}) =>
      pdfDoc.text(rtl(txt), x, y, { width: w, align: 'right', ...opts });

    const fmtEUR = (n) => `€${Number(n || 0).toFixed(2)}`;

    let y = 45;
    const logoSize = 55;

    // ---------- LOGO on RIGHT ----------
    const logoX = pageRight - logoSize;

    pdfDoc.circle(logoX + logoSize / 2, y + logoSize / 2, logoSize / 2).strokeColor(green).lineWidth(2.5).stroke();

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

    [{ x: -10, y: 8 }, { x: -2, y: -2 }, { x: 8, y: -10 }].forEach((o) => {
      pdfDoc.circle(logoX + logoSize / 2 + o.x, y + logoSize / 2 + o.y, 2.5).fillColor(green).fill();
    });

    // ---------- COMPANY NAME (Arabic only) ----------
    const headerTextW = contentW - (logoSize + 14);

    pdfDoc.font('Amiri-Bold').fontSize(28).fillColor(black);
    rtext('مواسم الخير', pageLeft, y + 0, headerTextW);

    pdfDoc.font('Amiri').fontSize(12).fillColor(gray);
    rtext('منتجات عضوية وأغذية طبيعية', pageLeft, y + 32, headerTextW);

    y += logoSize + 22;
    pdfDoc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(black).lineWidth(2).stroke();
    y += 18;

    // ---------- INVOICE HEADER ----------
    pdfDoc.font('Amiri-Bold').fontSize(24).fillColor(black);
    rtext('فاتورة', pageLeft, y, contentW);

    // invoice number box on LEFT
    const boxW = 155;
    pdfDoc.rect(pageLeft, y - 4, boxW, 36).strokeColor(green).lineWidth(2).stroke();
    pdfDoc.font('Amiri-Bold').fontSize(18).fillColor(green);
    pdfDoc.text(`#${invoiceNumber}`, pageLeft, y + 4, { width: boxW, align: 'center' });

    y += 42;

    // Date + status
    const dateStr = orderDate.toLocaleDateString('ar-SY', { day: 'numeric', month: 'long', year: 'numeric' });
    const st = statusArabic[status] || 'جديد';

    pdfDoc.font('Amiri').fontSize(11).fillColor(medGray);
    rtext(`التاريخ: ${dateStr}`, pageLeft, y, contentW);
    pdfDoc.text(rtl(`الحالة: ${st}`), pageLeft, y, { width: contentW, align: 'left' });
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
    ];
    if (customer.notes) customerRows.push(['ملاحظات', customer.notes]);

    customerRows.forEach(([label, value]) => {
      pdfDoc.font('Amiri-Bold').fontSize(11).fillColor(medGray);
      rtext(`${label}:`, pageRight - 160, y, 160);

      pdfDoc.font('Amiri').fontSize(11).fillColor(gray);
      rtext(String(value ?? ''), pageLeft, y, contentW - 170);
      y += 18;
    });

    y += 8;

    // ---------- ITEMS TABLE ----------
    pdfDoc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(border).lineWidth(1).stroke();
    y += 12;

    pdfDoc.font('Amiri-Bold').fontSize(13).fillColor(black);
    rtext('المنتجات', pageLeft, y, contentW);
    y += 20;

    pdfDoc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(green).lineWidth(1.5).stroke();
    y += 8;

    // Columns RTL: المنتج | الكمية | السعر | المجموع
    const colTotalW = 90;
    const colPriceW = 80;
    const colQtyW = 55;
    const colNameW = contentW - (colTotalW + colPriceW + colQtyW);

    const colTotalX = pageLeft;
    const colPriceX = colTotalX + colTotalW;
    const colQtyX = colPriceX + colPriceW;
    const colNameX = colQtyX + colQtyW;

    pdfDoc.font('Amiri-Bold').fontSize(11).fillColor(black);
    pdfDoc.text(rtl('المجموع'), colTotalX, y, { width: colTotalW, align: 'right' });
    pdfDoc.text(rtl('السعر'), colPriceX, y, { width: colPriceW, align: 'right' });
    pdfDoc.text(rtl('الكمية'), colQtyX, y, { width: colQtyW, align: 'right' });
    pdfDoc.text(rtl('المنتج'), colNameX, y, { width: colNameW, align: 'right' });

    y += 16;
    pdfDoc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(green).lineWidth(1).stroke();
    y += 10;

    pdfDoc.font('Amiri').fontSize(11).fillColor(gray);

    items.forEach((item, i) => {
      const name = item.unit ? `${item.name} (${item.unit})` : item.name;
      const itemTotal = Number(item.price || 0) * Number(item.qty || 0);

      pdfDoc.text(rtl(fmtEUR(itemTotal)), colTotalX, y, { width: colTotalW, align: 'right' });
      pdfDoc.text(rtl(fmtEUR(item.price)), colPriceX, y, { width: colPriceW, align: 'right' });
      pdfDoc.text(rtl(String(item.qty)), colQtyX, y, { width: colQtyW, align: 'right' });
      pdfDoc.text(rtl(String(name)), colNameX, y, { width: colNameW, align: 'right' });

      y += 20;
      if (i < items.length - 1) {
        pdfDoc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(border).lineWidth(0.5).stroke();
        y += 8;
      }
    });

    pdfDoc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(green).lineWidth(1.5).stroke();
    y += 18;

    // ---------- TOTALS ----------
    pdfDoc.font('Amiri').fontSize(11).fillColor(medGray);
    pdfDoc.text(rtl('المجموع الفرعي:'), pageLeft, y, { width: 120, align: 'right' });
    pdfDoc.text(rtl(fmtEUR(total)), pageLeft + 120, y, { width: 90, align: 'right' });
    y += 18;

    pdfDoc.text(rtl('الضريبة (0%):'), pageLeft, y, { width: 120, align: 'right' });
    pdfDoc.text(rtl('€0.00'), pageLeft + 120, y, { width: 90, align: 'right' });
    y += 18;

    pdfDoc.moveTo(pageLeft, y).lineTo(pageLeft + 210, y).strokeColor(green).lineWidth(2).stroke();
    y += 10;

    pdfDoc.rect(pageLeft, y, 210, 34).fillColor(green).fill();
    pdfDoc.font('Amiri-Bold').fontSize(14).fillColor('white');
    pdfDoc.text(rtl('المجموع الكلي:'), pageLeft + 10, y + 8, { width: 120, align: 'right' });
    pdfDoc.text(rtl(fmtEUR(total)), pageLeft + 130, y + 8, { width: 70, align: 'right' });
    y += 50;

    // ---------- FOOTER ----------
    const paymentArabic = 'الدفع عند الاستلام';

    pdfDoc.font('Amiri').fontSize(11).fillColor(medGray);
    rtext(`طريقة الدفع: ${paymentArabic}`, pageLeft, y, contentW);

    y += 30;
    pdfDoc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(border).lineWidth(1).stroke();
    y += 12;

    pdfDoc.font('Amiri-Bold').fontSize(13).fillColor(black);
    pdfDoc.text(rtl('شكراً لاختياركم مواسم الخير! 🌿'), pageLeft, y, { width: contentW, align: 'center' });
    y += 18;

    pdfDoc.font('Amiri').fontSize(10).fillColor(lightGray);
    pdfDoc.text(rtl('للاستفسار، يرجى التواصل عبر واتساب أو الهاتف'), pageLeft, y, {
      width: contentW,
      align: 'center',
    });

    pdfDoc.end();
  } catch (err) {
    console.error('Invoice error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate invoice', details: err?.message || String(err) });
    }
  }
}