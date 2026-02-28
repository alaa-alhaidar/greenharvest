// pages/api/admin/generate-invoice.js
// Generates a clean, printer-friendly PDF invoice
// Protected by ADMIN_SECRET env var.

import { db } from '../../../lib/firebase-admin';
import PDFDocument from 'pdfkit';

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

    const orderDate = data.createdAt?.toDate?.() 
                      || (data.timestamp ? new Date(data.timestamp) : new Date());

    // Create PDF
    const pdfDoc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="MawasimAlKhair-Invoice-${doc.id.slice(-6).toUpperCase()}.pdf"`);

    // Pipe PDF to response
    pdfDoc.pipe(res);

    // Black and white for printing
    const black = '#000000';
    const darkGray = '#333333';
    const mediumGray = '#666666';
    const lightGray = '#999999';
    const borderColor = '#CCCCCC';

    let yPos = 50;

    // ===== HEADER =====
    
    // Logo - Simple leaf icon
    const logoSize = 45;
    pdfDoc
      .circle(50 + logoSize/2, yPos + logoSize/2, logoSize/2)
      .strokeColor(black)
      .lineWidth(2.5)
      .stroke();
    
    // Leaf inside
    pdfDoc
      .moveTo(50 + logoSize/2, yPos + logoSize/2 + 8)
      .lineTo(50 + logoSize/2, yPos + logoSize/2 - 12)
      .strokeColor(black)
      .lineWidth(2.5)
      .stroke();
    
    pdfDoc
      .moveTo(50 + logoSize/2, yPos + logoSize/2 - 12)
      .bezierCurveTo(
        50 + logoSize/2 + 10, yPos + logoSize/2 - 6,
        50 + logoSize/2 + 12, yPos + logoSize/2 + 2,
        50 + logoSize/2, yPos + logoSize/2 + 6
      )
      .strokeColor(black)
      .lineWidth(2.5)
      .stroke();
    
    pdfDoc
      .moveTo(50 + logoSize/2, yPos + logoSize/2 - 12)
      .bezierCurveTo(
        50 + logoSize/2 - 10, yPos + logoSize/2 - 6,
        50 + logoSize/2 - 12, yPos + logoSize/2 + 2,
        50 + logoSize/2, yPos + logoSize/2 + 6
      )
      .strokeColor(black)
      .lineWidth(2.5)
      .stroke();

    // Company name
    pdfDoc
      .fontSize(24)
      .fillColor(black)
      .font('Helvetica-Bold')
      .text('MAWASIM AL-KHAIR', 110, yPos + 5);

    pdfDoc
      .fontSize(11)
      .fillColor(darkGray)
      .font('Helvetica')
      .text('Organic Products & Natural Foods', 110, yPos + 32);

    yPos += logoSize + 20;

    // Horizontal line
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(black)
      .lineWidth(2)
      .stroke();

    yPos += 25;

    // ===== INVOICE INFO =====
    
    pdfDoc
      .fontSize(22)
      .fillColor(black)
      .font('Helvetica-Bold')
      .text('INVOICE', 50, yPos);

    // Invoice number in box
    pdfDoc
      .rect(400, yPos - 5, 145, 35)
      .strokeColor(black)
      .lineWidth(2)
      .stroke();

    pdfDoc
      .fontSize(18)
      .text(`#${doc.id.slice(-6).toUpperCase()}`, 400, yPos + 5, { width: 145, align: 'center' });

    yPos += 45;

    // Date and Status
    pdfDoc
      .fontSize(10)
      .fillColor(darkGray)
      .font('Helvetica')
      .text(`Date: ${orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 50, yPos);

    const statusText = (data.status || 'new').toLowerCase();
    pdfDoc
      .text(`Status: ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`, 400, yPos, { width: 145, align: 'right' });

    yPos += 30;

    // ===== CUSTOMER SECTION =====
    
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();

    yPos += 15;

    pdfDoc
      .fontSize(12)
      .fillColor(black)
      .font('Helvetica-Bold')
      .text('BILL TO:', 50, yPos);

    yPos += 20;

    const customerDetails = [
      ['Name:', customer.name],
      ['Phone:', customer.phone],
      ['Address:', customer.address]
    ];

    if (customer.notes) {
      customerDetails.push(['Notes:', customer.notes]);
    }

    customerDetails.forEach(([label, value]) => {
      pdfDoc
        .fontSize(10)
        .fillColor(mediumGray)
        .font('Helvetica-Bold')
        .text(label, 50, yPos, { width: 70, continued: true })
        .fillColor(darkGray)
        .font('Helvetica')
        .text(value, { width: 425 });
      yPos += 16;
    });

    yPos += 15;

    // ===== ITEMS TABLE =====
    
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();

    yPos += 15;

    pdfDoc
      .fontSize(12)
      .fillColor(black)
      .font('Helvetica-Bold')
      .text('ORDER ITEMS:', 50, yPos);

    yPos += 22;

    // Table header
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(black)
      .lineWidth(1.5)
      .stroke();

    yPos += 8;

    pdfDoc
      .fontSize(10)
      .fillColor(black)
      .font('Helvetica-Bold')
      .text('ITEM', 55, yPos)
      .text('QTY', 340, yPos, { width: 30, align: 'center' })
      .text('PRICE', 390, yPos, { width: 50, align: 'right' })
      .text('TOTAL', 470, yPos, { width: 65, align: 'right' });

    yPos += 15;

    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(black)
      .lineWidth(1)
      .stroke();

    yPos += 10;

    // Table rows
    pdfDoc.fontSize(10).fillColor(darkGray).font('Helvetica');
    
    items.forEach((item, i) => {
      const itemName = item.unit ? `${item.name} (${item.unit})` : item.name;
      
      pdfDoc
        .text(itemName, 55, yPos, { width: 275 })
        .text(item.qty.toString(), 340, yPos, { width: 30, align: 'center' })
        .text(`€${item.price.toFixed(2)}`, 390, yPos, { width: 50, align: 'right' })
        .font('Helvetica-Bold')
        .fillColor(black)
        .text(`€${(item.price * item.qty).toFixed(2)}`, 470, yPos, { width: 65, align: 'right' });

      yPos += 18;
      
      // Divider between items
      if (i < items.length - 1) {
        pdfDoc
          .moveTo(50, yPos)
          .lineTo(545, yPos)
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .stroke();
        yPos += 8;
      }
    });

    // Bottom border
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(black)
      .lineWidth(1.5)
      .stroke();

    yPos += 20;

    // ===== TOTALS =====
    
    const total = data.total || 0;

    // Subtotal
    pdfDoc
      .fontSize(10)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Subtotal:', 390, yPos, { width: 70, align: 'right' })
      .fillColor(darkGray)
      .text(`€${total.toFixed(2)}`, 470, yPos, { width: 65, align: 'right' });

    yPos += 16;

    // Tax
    pdfDoc
      .fillColor(mediumGray)
      .text('Tax (0%):', 390, yPos, { width: 70, align: 'right' })
      .fillColor(darkGray)
      .text('€0.00', 470, yPos, { width: 65, align: 'right' });

    yPos += 16;

    // Line above total
    pdfDoc
      .moveTo(390, yPos)
      .lineTo(545, yPos)
      .strokeColor(black)
      .lineWidth(2)
      .stroke();

    yPos += 10;

    // Total box
    pdfDoc
      .rect(390, yPos, 155, 32)
      .fillColor(black)
      .fill();

    pdfDoc
      .fontSize(13)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text('TOTAL:', 400, yPos + 10, { width: 60, align: 'left' })
      .fontSize(14)
      .text(`€${total.toFixed(2)}`, 470, yPos + 10, { width: 65, align: 'right' });

    yPos += 45;

    // ===== PAYMENT =====
    
    pdfDoc
      .fontSize(10)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(`Payment Method: ${(data.paymentMethod || 'cash_on_delivery').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`, 50, yPos);

    yPos += 35;

    // ===== FOOTER =====
    
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();

    yPos += 15;

    pdfDoc
      .fontSize(11)
      .fillColor(black)
      .font('Helvetica-Bold')
      .text('Thank you for choosing Mawasim Al-Khair!', 50, yPos, { align: 'center', width: 495 });

    yPos += 16;

    pdfDoc
      .fontSize(9)
      .fillColor(lightGray)
      .font('Helvetica')
      .text('For inquiries, contact us via WhatsApp or phone', 50, yPos, { align: 'center', width: 495 });

    // Finalize PDF
    pdfDoc.end();

  } catch (err) {
    console.error('Invoice generation error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to generate invoice',
        details: err.message
      });
    }
  }
}