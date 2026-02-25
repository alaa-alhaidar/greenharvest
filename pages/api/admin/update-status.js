// pages/api/admin/update-status.js
// Server-side only — updates an order's status in Firestore.
// Protected by ADMIN_SECRET env var.

import { db } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const VALID_STATUSES = ['new', 'confirmed', 'preparing', 'delivered', 'cancelled'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin secret
  const secret = "admin123"; //process.env.ADMIN_SECRET
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { orderId, status } = req.body || {};

  if (!orderId || typeof orderId !== 'string') {
    return res.status(422).json({ error: 'Invalid order ID' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(422).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    await db.collection('orders').doc(orderId).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Status update error:', err);
    return res.status(500).json({ error: 'Failed to update order' });
  }
}
