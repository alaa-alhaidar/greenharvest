 // pages/api/order.js
// FIXED VERSION - Saves customer data properly

import { db } from '../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customer, paymentMethod } = req.body;

    // Validate
    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided' });
    }

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({ error: 'Customer info required' });
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      return sum + (item.priceEach * item.quantity);
    }, 0);

    // Create order object
    const orderData = {
      // Customer info
      customer: {
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || ''
      },
      
      // Items
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        priceEach: item.priceEach,
        quantity: item.quantity,
        unit: item.unit || ''
      })),
      
      // Order details
      total,
      status: 'new',
      paymentMethod: paymentMethod || 'cash_on_delivery',
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Saving order:', orderData);

    // Save to Firestore
    const docRef = await db.collection('orders').add(orderData);

    // Generate short ID
    const shortId = docRef.id.slice(-6).toUpperCase();

    console.log('✅ Order saved:', docRef.id);

    return res.status(200).json({
      success: true,
      orderId: docRef.id,
      shortId,
      total
    });

  } catch (error) {
    console.error('❌ Order creation error:', error);
    return res.status(500).json({
      error: 'Failed to create order',
      details: error.message
    });
  }
}