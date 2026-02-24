// pages/api/admin/orders.js
// Server-side only — fetches all orders from Firestore.
// Protected by ADMIN_SECRET env var.

import { db } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  // Only GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin secret
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const snapshot = await db
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id:            doc.id,
        shortId:       doc.id.slice(-6).toUpperCase(),
        customer:      data.customer,
        items:         data.items,
        total:         data.total,
        status:        data.status,
        paymentMethod: data.paymentMethod,
        createdAt:     data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return res.status(200).json({ orders });
  } catch (err) {
    console.error('Admin fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}
