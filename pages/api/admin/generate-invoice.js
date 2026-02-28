 // pages/api/admin/generate-invoice.js
// Invoice with olive branch logo

import { db } from '../../../lib/firebase-admin';
import PDFDocument from 'pdfkit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { orderId } = req.body || {};
  if (!orderId) return res.status(422).json({ error: 'Invalid order ID' });

  try {
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });

    const data = doc.data();
    const customer = {
      name: data.customerName || data.customer?.name || 'Unknown',
      phone: data.customerPhone || data.customer?.phone || 'N/A',
      address: data.customerAddress || data.customer?.address || 'N/A',
      notes: data.note || data.notes || data.customer?.notes || ''
    };

    const items = (data.items || []).map(item => ({
      name: item.productName || item.name || 'Product',
      qty: item.quantity || item.qty || 1,
      price: item.priceEach || item.price || 0,
      unit: item.unit || ''
    }));

    const orderDate = data.createdAt?.toDate?.() || (data.timestamp ? new Date(data.timestamp) : new Date());

    const pdfDoc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 }});
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="MawasimAlKhair-Invoice-${doc.id.slice(-6).toUpperCase()}.pdf"`);
    pdfDoc.pipe(res);

    const green = '#2A6041';
    const black = '#000000';
    const gray = '#333333';
    const medGray = '#666666';
    const lightGray = '#999999';
    const border = '#CCCCCC';

    let y = 45;
    const logoX = 50, logoSize = 55;

    // Circular logo border
    pdfDoc.circle(logoX + logoSize/2, y + logoSize/2, logoSize/2).strokeColor(green).lineWidth(2.5).stroke();
    
    // Olive branch stem
    pdfDoc.moveTo(logoX + logoSize/2 - 15, y + logoSize/2 + 15)
      .bezierCurveTo(logoX + logoSize/2 - 10, y + logoSize/2, logoX + logoSize/2 - 5, y + logoSize/2 - 10, logoX + logoSize/2 + 15, y + logoSize/2 - 15)
      .strokeColor(green).lineWidth(2.5).stroke();
    
    // Olive leaves
    [{ x: -12, y: 10, angle: -30 }, { x: -8, y: 5, angle: 30 }, { x: -4, y: 0, angle: -20 },
     { x: 0, y: -5, angle: 25 }, { x: 5, y: -8, angle: -25 }, { x: 10, y: -12, angle: 20 }]
      .forEach(leaf => {
        pdfDoc.save().translate(logoX + logoSize/2 + leaf.x, y + logoSize/2 + leaf.y).rotate(leaf.angle);
        pdfDoc.ellipse(0, 0, 5, 2.5).fillColor(green).fill();
        pdfDoc.restore();
      });
    
    // Olives
    [{ x: -10, y: 8 }, { x: -2, y: -2 }, { x: 8, y: -10 }]
      .forEach(o => pdfDoc.circle(logoX + logoSize/2 + o.x, y + logoSize/2 + o.y, 2.5).fillColor(green).fill());

    // Company name
    pdfDoc.fontSize(24).fillColor(black).font('Helvetica-Bold').text('MAWASIM AL-KHAIR', logoX + logoSize + 18, y + 8);
    pdfDoc.fontSize(11).fillColor(gray).font('Helvetica').text('Organic Products & Natural Foods', logoX + logoSize + 18, y + 35);

    y += logoSize + 22;
    pdfDoc.moveTo(50, y).lineTo(545, y).strokeColor(black).lineWidth(2).stroke();
    y += 25;

    // Invoice header
    pdfDoc.fontSize(22).fillColor(black).font('Helvetica-Bold').text('INVOICE', 50, y);
    pdfDoc.rect(400, y - 5, 145, 35).strokeColor(green).lineWidth(2).stroke();
    pdfDoc.fontSize(18).fillColor(green).text(`#${doc.id.slice(-6).toUpperCase()}`, 400, y + 5, { width: 145, align: 'center' });
    y += 45;

    pdfDoc.fontSize(10).fillColor(gray).font('Helvetica')
      .text(`Date: ${orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 50, y)
      .text(`Status: ${(data.status || 'new').charAt(0).toUpperCase() + (data.status || 'new').slice(1).toLowerCase()}`, 400, y, { width: 145, align: 'right' });
    y += 30;

    // Customer
    pdfDoc.moveTo(50, y).lineTo(545, y).strokeColor(border).lineWidth(1).stroke();
    y += 15;
    pdfDoc.fontSize(12).fillColor(black).font('Helvetica-Bold').text('BILL TO:', 50, y);
    y += 20;

    [['Name:', customer.name], ['Phone:', customer.phone], ['Address:', customer.address]]
      .concat(customer.notes ? [['Notes:', customer.notes]] : [])
      .forEach(([label, value]) => {
        pdfDoc.fontSize(10).fillColor(medGray).font('Helvetica-Bold').text(label, 50, y, { width: 70, continued: true })
          .fillColor(gray).font('Helvetica').text(value, { width: 425 });
        y += 16;
      });
    y += 15;

    // Items table
    pdfDoc.moveTo(50, y).lineTo(545, y).strokeColor(border).lineWidth(1).stroke();
    y += 15;
    pdfDoc.fontSize(12).fillColor(black).font('Helvetica-Bold').text('ORDER ITEMS:', 50, y);
    y += 22;

    pdfDoc.moveTo(50, y).lineTo(545, y).strokeColor(green).lineWidth(1.5).stroke();
    y += 8;
    pdfDoc.fontSize(10).fillColor(black).font('Helvetica-Bold')
      .text('ITEM', 55, y).text('QTY', 340, y, { width: 30, align: 'center' })
      .text('PRICE', 390, y, { width: 50, align: 'right' }).text('TOTAL', 470, y, { width: 65, align: 'right' });
    y += 15;
    pdfDoc.moveTo(50, y).lineTo(545, y).strokeColor(green).lineWidth(1).stroke();
    y += 10;

    items.forEach((item, i) => {
      const name = item.unit ? `${item.name} (${item.unit})` : item.name;
      pdfDoc.fontSize(10).fillColor(gray).font('Helvetica').text(name, 55, y, { width: 275 })
        .text(item.qty.toString(), 340, y, { width: 30, align: 'center' })
        .text(`€${item.price.toFixed(2)}`, 390, y, { width: 50, align: 'right' })
        .font('Helvetica-Bold').fillColor(black).text(`€${(item.price * item.qty).toFixed(2)}`, 470, y, { width: 65, align: 'right' });
      y += 18;
      if (i < items.length - 1) {
        pdfDoc.moveTo(50, y).lineTo(545, y).strokeColor(border).lineWidth(0.5).stroke();
        y += 8;
      }
    });

    pdfDoc.moveTo(50, y).lineTo(545, y).strokeColor(green).lineWidth(1.5).stroke();
    y += 20;

    // Totals
    const total = data.total || 0;
    pdfDoc.fontSize(10).fillColor(medGray).font('Helvetica').text('Subtotal:', 390, y, { width: 70, align: 'right' })
      .fillColor(gray).text(`€${total.toFixed(2)}`, 470, y, { width: 65, align: 'right' });
    y += 16;
    pdfDoc.fillColor(medGray).text('Tax (0%):', 390, y, { width: 70, align: 'right' })
      .fillColor(gray).text('€0.00', 470, y, { width: 65, align: 'right' });
    y += 16;
    pdfDoc.moveTo(390, y).lineTo(545, y).strokeColor(green).lineWidth(2).stroke();
    y += 10;
    pdfDoc.rect(390, y, 155, 32).fillColor(green).fill();
    pdfDoc.fontSize(13).fillColor('white').font('Helvetica-Bold').text('TOTAL:', 400, y + 10, { width: 60, align: 'left' })
      .fontSize(14).text(`€${total.toFixed(2)}`, 470, y + 10, { width: 65, align: 'right' });
    y += 45;

    // Footer
    pdfDoc.fontSize(10).fillColor(medGray).font('Helvetica')
      .text(`Payment Method: ${(data.paymentMethod || 'cash_on_delivery').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`, 50, y);
    y += 35;
    pdfDoc.moveTo(50, y).lineTo(545, y).strokeColor(border).lineWidth(1).stroke();
    y += 15;
    pdfDoc.fontSize(11).fillColor(black).font('Helvetica-Bold').text('Thank you for choosing Mawasim Al-Khair!', 50, y, { align: 'center', width: 495 });
    y += 16;
    pdfDoc.fontSize(9).fillColor(lightGray).font('Helvetica').text('For inquiries, contact us via WhatsApp or phone', 50, y, { align: 'center', width: 495 });

    pdfDoc.end();
  } catch (err) {
    console.error('Invoice error:', err);
    if (!res.headersSent) return res.status(500).json({ error: 'Failed to generate invoice', details: err.message });
  }
}