 // pages/api/admin/orders.js
// Fetch all orders from Firestore
// Protected by ADMIN_SECRET

import { db } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin secret
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Fetch all orders from Firestore
    const ordersSnap = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const orders = [];
    ordersSnap.forEach(doc => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        shortId: doc.id.slice(-6).toUpperCase(),
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString(),
        customer: {
          name: data.customerName || '',
          phone: data.customerPhone || '',
          address: data.customerAddress || '',
          notes: data.customerNotes || data.note || '',
        },
        items: (data.items || []).map(item => ({
          name: item.productName || item.name || '',
          price: item.priceEach || item.price || 0,
          qty: item.quantity || item.qty || 1,
          unit: item.unit || '',
        })),
        total: data.total || 0,
        status: data.status || 'new',
      });
    });

    return res.status(200).json({
      orders,
      count: orders.length,
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch orders',
      details: error.message
    });
  }
}