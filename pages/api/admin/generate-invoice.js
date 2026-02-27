// pages/api/admin/generate-invoice.js
// Generates a PDF invoice for an order using pdfkit
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
    res.setHeader('Content-Disposition', `attachment; filename="GreenHarvest-Invoice-${doc.id.slice(-6).toUpperCase()}.pdf"`);

    // Pipe PDF to response
    pdfDoc.pipe(res);

    // Colors
    const greenDark = '#1E3D2F';
    const greenMid = '#2A6041';
    const greenLight = '#4A9B6F';
    const gold = '#C8790A';
    const gray = '#4A4A4A';
    const lightGray = '#8A8A8A';

    // Header - Company Name
    pdfDoc
      .fontSize(28)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('🌿 GreenHarvest', 50, 50);

    pdfDoc
      .fontSize(11)
      .fillColor(greenLight)
      .font('Helvetica')
      .text('Organic Products & Natural Foods', 50, 85);

    // Horizontal line
    pdfDoc
      .moveTo(50, 110)
      .lineTo(545, 110)
      .strokeColor('#E2DDD5')
      .stroke();

    // Invoice Title and Info
    pdfDoc
      .fontSize(16)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('INVOICE', 50, 130);

    pdfDoc
      .fontSize(16)
      .fillColor(gold)
      .text(`#${doc.id.slice(-6).toUpperCase()}`, 400, 130, { width: 145, align: 'right' });

    pdfDoc
      .fontSize(10)
      .fillColor(gray)
      .font('Helvetica')
      .text(`Date: ${orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 400, 150, { width: 145, align: 'right' })
      .text(`Status: ${(data.status || 'new').charAt(0).toUpperCase() + (data.status || 'new').slice(1)}`, 400, 165, { width: 145, align: 'right' });

    // Bill To Section
    pdfDoc
      .fontSize(12)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Bill To:', 50, 200);

    let yPos = 220;
    pdfDoc
      .fontSize(10)
      .fillColor(gray)
      .font('Helvetica-Bold')
      .text('Name:', 50, yPos)
      .font('Helvetica')
      .text(customer.name, 120, yPos);

    yPos += 15;
    pdfDoc
      .font('Helvetica-Bold')
      .text('Phone:', 50, yPos)
      .font('Helvetica')
      .text(customer.phone, 120, yPos);

    yPos += 15;
    pdfDoc
      .font('Helvetica-Bold')
      .text('Address:', 50, yPos)
      .font('Helvetica')
      .text(customer.address, 120, yPos, { width: 425 });

    if (customer.notes) {
      yPos += 30;
      pdfDoc
        .font('Helvetica-Bold')
        .text('Notes:', 50, yPos)
        .font('Helvetica')
        .text(customer.notes, 120, yPos, { width: 425 });
    }

    // Items Table
    yPos += 50;
    pdfDoc
      .fontSize(12)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Order Items:', 50, yPos);

    // Table Header
    yPos += 25;
    const tableTop = yPos;
    
    pdfDoc
      .rect(50, yPos, 495, 25)
      .fillColor(greenDark)
      .fill();

    pdfDoc
      .fontSize(11)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text('Item', 60, yPos + 8)
      .text('Qty', 320, yPos + 8, { width: 40, align: 'right' })
      .text('Unit Price', 370, yPos + 8, { width: 70, align: 'right' })
      .text('Total', 450, yPos + 8, { width: 85, align: 'right' });

    yPos += 25;

    // Table Rows
    pdfDoc.fontSize(10).fillColor(gray).font('Helvetica');
    
    items.forEach((item, i) => {
      const bgColor = i % 2 === 0 ? '#FFFFFF' : '#F8F6F1';
      pdfDoc.rect(50, yPos, 495, 25).fillColor(bgColor).fill();

      const itemName = item.unit ? `${item.name} (${item.unit})` : item.name;
      
      pdfDoc
        .fillColor(gray)
        .text(itemName, 60, yPos + 8, { width: 250 })
        .text(item.qty.toString(), 320, yPos + 8, { width: 40, align: 'right' })
        .text(`€${item.price.toFixed(2)}`, 370, yPos + 8, { width: 70, align: 'right' })
        .text(`€${(item.price * item.qty).toFixed(2)}`, 450, yPos + 8, { width: 85, align: 'right' });

      yPos += 25;
    });

    // Subtotal, Tax, Total
    yPos += 10;
    const total = data.total || 0;

    pdfDoc
      .moveTo(370, yPos)
      .lineTo(545, yPos)
      .strokeColor('#E2DDD5')
      .stroke();

    yPos += 10;

    pdfDoc
      .fontSize(10)
      .fillColor(gray)
      .font('Helvetica-Bold')
      .text('Subtotal:', 370, yPos, { width: 70, align: 'right' })
      .text(`€${total.toFixed(2)}`, 450, yPos, { width: 85, align: 'right' });

    yPos += 15;
    pdfDoc
      .text('Tax (0%):', 370, yPos, { width: 70, align: 'right' })
      .text('€0.00', 450, yPos, { width: 85, align: 'right' });

    yPos += 15;

    pdfDoc
      .moveTo(370, yPos)
      .lineTo(545, yPos)
      .lineWidth(2)
      .strokeColor(greenDark)
      .stroke();

    yPos += 10;

    pdfDoc
      .rect(370, yPos, 175, 30)
      .fillColor('#E8F5EE')
      .fill();

    pdfDoc
      .fontSize(12)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Total:', 380, yPos + 10, { width: 60, align: 'left' })
      .text(`€${total.toFixed(2)}`, 450, yPos + 10, { width: 85, align: 'right' });

    // Payment Method
    yPos += 50;
    pdfDoc
      .fontSize(10)
      .fillColor(gray)
      .font('Helvetica')
      .text(`Payment Method: ${(data.paymentMethod || 'cash_on_delivery').replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`, 50, yPos);

    // Footer
    yPos += 60;
    pdfDoc
      .fontSize(9)
      .fillColor(lightGray)
      .font('Helvetica')
      .text('Thank you for choosing GreenHarvest!', 50, yPos, { align: 'center', width: 495 });

    pdfDoc
      .text('For inquiries, contact us via WhatsApp or phone', 50, yPos + 15, { align: 'center', width: 495 });

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