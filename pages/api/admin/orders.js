 // pages/api/admin/orders.js
// Fetches all orders - handles missing customer data

import { db } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const ordersSnap = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const orders = [];
    
    ordersSnap.forEach(doc => {
      const data = doc.data();
      
      console.log('📦 Raw order from Firestore:', doc.id, data);
      
      // Extract customer - handle ALL possible formats
      let customer = null;
      
      if (data.customer && typeof data.customer === 'object') {
        // Format 1: Nested customer object
        customer = {
          name: data.customer.name || '',
          phone: data.customer.phone || '',
          address: data.customer.address || '',
          notes: data.customer.notes || ''
        };
      } else if (data.customerName || data.customerPhone || data.customerAddress) {
        // Format 2: Flat fields
        customer = {
          name: data.customerName || '',
          phone: data.customerPhone || '',
          address: data.customerAddress || '',
          notes: data.customerNotes || data.note || ''
        };
      }
      
      // Build order object
      const order = {
        id: doc.id,
        shortId: doc.id.slice(-6).toUpperCase(),
        status: (data.status || 'new').toLowerCase(),
        total: data.total || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || 
                   data.timestamp || 
                   new Date().toISOString(),
        items: (data.items || []).map(item => ({
          productName: item.productName || item.name || '',
          priceEach: item.priceEach || item.price || 0,
          quantity: item.quantity || item.qty || 1,
          unit: item.unit || ''
        }))
      };
      
      // Only add customer if data exists
      if (customer && (customer.name || customer.phone || customer.address)) {
        order.customer = customer;
      }
      
      orders.push(order);
    });

    console.log(`✅ Returning ${orders.length} orders`);
    
    return res.status(200).json({
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error('❌ Orders fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch orders',
      details: error.message
    });
  }
}