 // pages/api/admin/generate-invoice.js
// Generates a printer-friendly PDF invoice with Arabic branding
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

    // Minimal colors for printing
    const darkGray = '#1A1A1A';
    const mediumGray = '#4A4A4A';
    const lightGray = '#8A8A8A';
    const borderColor = '#CCCCCC';

    // ===== LOGO - Simple leaf icon =====
    
    const logoX = 50;
    const logoY = 50;
    const logoSize = 50;
    
    // Simple circular outline
    pdfDoc
      .circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2)
      .strokeColor(darkGray)
      .lineWidth(2)
      .stroke();
    
    // Simple leaf inside
    pdfDoc
      .moveTo(logoX + logoSize/2, logoY + logoSize/2 + 10)
      .lineTo(logoX + logoSize/2, logoY + logoSize/2 - 15)
      .strokeColor(darkGray)
      .lineWidth(2)
      .stroke();
    
    pdfDoc
      .moveTo(logoX + logoSize/2, logoY + logoSize/2 - 15)
      .bezierCurveTo(
        logoX + logoSize/2 + 12, logoY + logoSize/2 - 8,
        logoX + logoSize/2 + 15, logoY + logoSize/2 + 2,
        logoX + logoSize/2, logoY + logoSize/2 + 8
      )
      .strokeColor(darkGray)
      .lineWidth(2)
      .stroke();
    
    pdfDoc
      .moveTo(logoX + logoSize/2, logoY + logoSize/2 - 15)
      .bezierCurveTo(
        logoX + logoSize/2 - 12, logoY + logoSize/2 - 8,
        logoX + logoSize/2 - 15, logoY + logoSize/2 + 2,
        logoX + logoSize/2, logoY + logoSize/2 + 8
      )
      .strokeColor(darkGray)
      .lineWidth(2)
      .stroke();

    // ===== BRAND NAME - Arabic primary =====
    
    const textX = logoX + logoSize + 15;
    
    // Arabic name - PRIMARY (larger, bold)
    pdfDoc
      .fontSize(22)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('مواسم الخير', textX, logoY + 5);

    // English name - secondary (smaller)
    pdfDoc
      .fontSize(12)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Mawasim Al-Khair (GreenHarvest)', textX, logoY + 32);

    // Horizontal line
    pdfDoc
      .moveTo(50, logoY + logoSize + 20)
      .lineTo(545, logoY + logoSize + 20)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();

    let yPos = logoY + logoSize + 40;

    // ===== INVOICE INFO =====
    
    // Invoice title and number in one line
    pdfDoc
      .fontSize(18)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('INVOICE', 50, yPos);

    pdfDoc
      .fontSize(16)
      .text(`#${doc.id.slice(-6).toUpperCase()}`, 420, yPos + 2, { width: 125, align: 'right' });

    yPos += 30;

    // Date and Status
    pdfDoc
      .fontSize(10)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(`Date: ${orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 50, yPos);

    pdfDoc
      .text(`Status: ${(data.status || 'new').charAt(0).toUpperCase() + (data.status || 'new').slice(1).toLowerCase()}`, 420, yPos, { width: 125, align: 'right' });

    yPos += 30;

    // Divider line
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();

    yPos += 20;

    // ===== CUSTOMER SECTION =====
    
    pdfDoc
      .fontSize(12)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('Bill To:', 50, yPos);

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
        .text(label, 50, yPos, { width: 60 })
        .fillColor(darkGray)
        .font('Helvetica')
        .text(value, 115, yPos, { width: 430 });
      yPos += 16;
    });

    yPos += 15;

    // ===== ITEMS TABLE =====
    
    pdfDoc
      .fontSize(12)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('Order Items:', 50, yPos);

    yPos += 20;

    // Table header - simple line-based
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(darkGray)
      .lineWidth(1.5)
      .stroke();

    yPos += 10;

    pdfDoc
      .fontSize(10)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('Item', 55, yPos)
      .text('Qty', 330, yPos, { width: 30, align: 'right' })
      .text('Price', 375, yPos, { width: 50, align: 'right' })
      .text('Total', 460, yPos, { width: 75, align: 'right' });

    yPos += 18;

    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(darkGray)
      .lineWidth(1)
      .stroke();

    yPos += 10;

    // Table rows - minimal styling
    pdfDoc.fontSize(10).fillColor(darkGray).font('Helvetica');
    
    items.forEach((item, i) => {
      const itemName = item.unit ? `${item.name} (${item.unit})` : item.name;
      
      pdfDoc
        .text(itemName, 55, yPos, { width: 265 })
        .text(item.qty.toString(), 330, yPos, { width: 30, align: 'right' })
        .text(`€${item.price.toFixed(2)}`, 375, yPos, { width: 50, align: 'right' })
        .font('Helvetica-Bold')
        .text(`€${(item.price * item.qty).toFixed(2)}`, 460, yPos, { width: 75, align: 'right' })
        .font('Helvetica');

      yPos += 20;
      
      // Light divider between items
      if (i < items.length - 1) {
        pdfDoc
          .moveTo(50, yPos)
          .lineTo(545, yPos)
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .stroke();
        yPos += 10;
      }
    });

    // Bottom border of table
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(darkGray)
      .lineWidth(1)
      .stroke();

    yPos += 25;

    // ===== TOTALS - Right aligned, minimal =====
    
    const total = data.total || 0;

    // Subtotal
    pdfDoc
      .fontSize(10)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Subtotal:', 380, yPos, { width: 70, align: 'right' })
      .fillColor(darkGray)
      .text(`€${total.toFixed(2)}`, 460, yPos, { width: 75, align: 'right' });

    yPos += 18;

    // Tax
    pdfDoc
      .fillColor(mediumGray)
      .text('Tax (0%):', 380, yPos, { width: 70, align: 'right' })
      .fillColor(darkGray)
      .text('€0.00', 460, yPos, { width: 75, align: 'right' });

    yPos += 18;

    // Line above total
    pdfDoc
      .moveTo(380, yPos)
      .lineTo(545, yPos)
      .strokeColor(darkGray)
      .lineWidth(1.5)
      .stroke();

    yPos += 12;

    // Total
    pdfDoc
      .fontSize(13)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('TOTAL:', 380, yPos, { width: 70, align: 'right' })
      .fontSize(14)
      .text(`€${total.toFixed(2)}`, 460, yPos, { width: 75, align: 'right' });

    yPos += 35;

    // ===== PAYMENT METHOD =====
    
    pdfDoc
      .fontSize(10)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text(`Payment Method: ${(data.paymentMethod || 'cash_on_delivery').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`, 50, yPos);

    yPos += 40;

    // Divider line
    pdfDoc
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();

    yPos += 20;

    // ===== FOOTER =====
    
    // Arabic thank you
    pdfDoc
      .fontSize(11)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('شكراً لاختياركم مواسم الخير', 50, yPos, { align: 'center', width: 495 });

    yPos += 18;

    // English thank you
    pdfDoc
      .fontSize(10)
      .fillColor(mediumGray)
      .font('Helvetica')
      .text('Thank you for choosing Mawasim Al-Khair (GreenHarvest)', 50, yPos, { align: 'center', width: 495 });

    yPos += 15;

    pdfDoc
      .fontSize(9)
      .fillColor(lightGray)
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