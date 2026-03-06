// pages/api/admin/debug-structure.js
// Shows actual order structure to fix JavaScript

import { db } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const snapshot = await db.collection('orders').limit(1).get();
    
    if (snapshot.empty) {
      return res.status(200).json({ message: 'No orders found' });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Show EXACT structure
    const structure = {
      id: doc.id,
      rawData: data,
      customerCheck: {
        hasCustomerObject: !!data.customer,
        hasCustomerName: !!data.customerName,
        hasCustomerPhone: !!data.customerPhone,
        hasCustomerAddress: !!data.customerAddress,
        customerObjectType: typeof data.customer,
        customerValue: data.customer
      },
      itemsCheck: {
        hasItems: !!data.items,
        itemsLength: data.items?.length || 0,
        firstItem: data.items?.[0] || null
      }
    };

    return res.status(200).json(structure);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}