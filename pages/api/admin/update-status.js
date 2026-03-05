// pages/api/admin/update-status.js
// Update order status
// Protected by ADMIN_SECRET

import { db } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { orderId, status } = req.body;

  if (!orderId || !status) {
    return res.status(422).json({ error: 'Missing orderId or status' });
  }

  const validStatuses = ['new', 'confirmed', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(422).json({ error: 'Invalid status' });
  }

  try {
    await db.collection('orders').doc(orderId).update({
      status,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      orderId,
      status,
    });

  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({
      error: 'Failed to update status',
      details: error.message
    });
  }
}