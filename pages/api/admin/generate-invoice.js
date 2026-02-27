// pages/api/admin/generate-invoice.js
// Generates a PDF invoice for an order with styled logo
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
    const greenPale = '#E8F5EE';
    const gold = '#C8790A';
    const gray = '#4A4A4A';
    const lightGray = '#8A8A8A';

    // ===== LOGO AND HEADER =====
    
    // Logo box with leaf icon
    const logoSize = 60;
    const logoX = 50;
    const logoY = 45;
    
    // Draw rounded rectangle for logo background
    pdfDoc
      .roundedRect(logoX, logoY, logoSize, logoSize, 12)
      .fillColor(greenDark)
      .fill();
    
    // Add leaf emoji in logo box
    pdfDoc
      .fontSize(32)
      .fillColor('white')
      .text('🌿', logoX + 14, logoY + 14);

    // Company Name
    pdfDoc
      .fontSize(24)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('GreenHarvest', logoX + logoSize + 15, logoY + 8);

    // Tagline
    pdfDoc
      .fontSize(10)
      .fillColor(greenLight)
      .font('Helvetica')
      .text('Organic Products & Natural Foods', logoX + logoSize + 15, logoY + 38);

    // Decorative line
    pdfDoc
      .moveTo(50, logoY + logoSize + 20)
      .lineTo(545, logoY + logoSize + 20)
      .strokeColor(greenPale)
      .lineWidth(2)
      .stroke();

    // Reset position
    let yPos = logoY + logoSize + 40;

    // ===== INVOICE INFO =====
    
    // Invoice title and number
    pdfDoc
      .fontSize(18)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('INVOICE', 50, yPos);

    pdfDoc
      .fontSize(18)
      .fillColor(gold)
      .text(`#${doc.id.slice(-6).toUpperCase()}`, 400, yPos, { width: 145, align: 'right' });

    yPos += 25;

    pdfDoc
      .fontSize(10)
      .fillColor(gray)
      .font('Helvetica')
      .text(`Date: ${orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 400, yPos, { width: 145, align: 'right' })
      .text(`Status: ${(data.status || 'new').charAt(0).toUpperCase() + (data.status || 'new').slice(1).toLowerCase()}`, 400, yPos + 15, { width: 145, align: 'right' });

    yPos += 50;

    // ===== CUSTOMER SECTION =====
    
    // "Bill To" header with background
    pdfDoc
      .roundedRect(50, yPos, 200, 25, 6)
      .fillColor(greenPale)
      .fill();

    pdfDoc
      .fontSize(12)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Bill To:', 60, yPos + 7);

    yPos += 35;

    // Customer details
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
        .fillColor(greenDark)
        .font('Helvetica-Bold')
        .text(label, 50, yPos)
        .fillColor(gray)
        .font('Helvetica')
        .text(value, 120, yPos, { width: 425 });
      yPos += 18;
    });

    yPos += 20;

    // ===== ITEMS TABLE =====
    
    // "Order Items" header
    pdfDoc
      .roundedRect(50, yPos, 200, 25, 6)
      .fillColor(greenPale)
      .fill();

    pdfDoc
      .fontSize(12)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Order Items:', 60, yPos + 7);

    yPos += 35;

    // Table Header
    pdfDoc
      .roundedRect(50, yPos, 495, 28, 8)
      .fillColor(greenDark)
      .fill();

    pdfDoc
      .fontSize(11)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text('Item', 60, yPos + 9)
      .text('Qty', 320, yPos + 9, { width: 40, align: 'right' })
      .text('Unit Price', 370, yPos + 9, { width: 70, align: 'right' })
      .text('Total', 450, yPos + 9, { width: 85, align: 'right' });

    yPos += 28;

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

    // ===== TOTALS SECTION =====
    
    yPos += 15;
    const total = data.total || 0;

    // Divider line
    pdfDoc
      .moveTo(370, yPos)
      .lineTo(545, yPos)
      .strokeColor('#E2DDD5')
      .lineWidth(1)
      .stroke();

    yPos += 12;

    // Subtotal
    pdfDoc
      .fontSize(10)
      .fillColor(gray)
      .font('Helvetica-Bold')
      .text('Subtotal:', 370, yPos, { width: 70, align: 'right' })
      .text(`€${total.toFixed(2)}`, 450, yPos, { width: 85, align: 'right' });

    yPos += 18;

    // Tax
    pdfDoc
      .text('Tax (0%):', 370, yPos, { width: 70, align: 'right' })
      .text('€0.00', 450, yPos, { width: 85, align: 'right' });

    yPos += 18;

    // Total line
    pdfDoc
      .moveTo(370, yPos)
      .lineTo(545, yPos)
      .lineWidth(2)
      .strokeColor(greenDark)
      .stroke();

    yPos += 12;

    // Total box
    pdfDoc
      .roundedRect(370, yPos, 175, 35, 8)
      .fillColor(greenPale)
      .fill();

    pdfDoc
      .fontSize(13)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Total:', 380, yPos + 11, { width: 60, align: 'left' })
      .fontSize(14)
      .text(`€${total.toFixed(2)}`, 450, yPos + 11, { width: 85, align: 'right' });

    // ===== FOOTER SECTION =====
    
    yPos += 55;

    // Payment method
    pdfDoc
      .fontSize(10)
      .fillColor(gray)
      .font('Helvetica')
      .text(`Payment Method: ${(data.paymentMethod || 'cash_on_delivery').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`, 50, yPos);

    yPos += 40;

    // Thank you message
    pdfDoc
      .fontSize(11)
      .fillColor(greenDark)
      .font('Helvetica-Bold')
      .text('Thank you for choosing GreenHarvest! 🌿', 50, yPos, { align: 'center', width: 495 });

    yPos += 18;

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