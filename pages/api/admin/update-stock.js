 // pages/api/admin/update-stock.js
// Update product stock levels
// Protected by ADMIN_SECRET

import { db } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin secret
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { productId, action, quantity } = req.body;

  if (!productId || !action) {
    return res.status(422).json({ error: 'Missing productId or action' });
  }

  try {
    const stockRef = db.collection('inventory').doc(productId);
    const stockDoc = await stockRef.get();

    let currentStock = 0;
    if (stockDoc.exists) {
      currentStock = stockDoc.data().stock || 0;
    }

    let newStock = currentStock;

    switch (action) {
      case 'add':
        newStock = currentStock + (quantity || 1);
        break;
      case 'subtract':
        newStock = Math.max(0, currentStock - (quantity || 1));
        break;
      case 'set':
        newStock = quantity || 0;
        break;
      default:
        return res.status(422).json({ error: 'Invalid action' });
    }

    // Update stock in Firestore
    await stockRef.set({
      productId,
      stock: newStock,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'admin',
    }, { merge: true });

    // Log stock change
    await db.collection('stockHistory').add({
      productId,
      action,
      quantity,
      previousStock: currentStock,
      newStock,
      timestamp: new Date().toISOString(),
      updatedBy: 'admin',
    });

    return res.status(200).json({
      success: true,
      productId,
      previousStock: currentStock,
      newStock,
    });

  } catch (error) {
    console.error('Stock update error:', error);
    return res.status(500).json({ 
      error: 'Failed to update stock',
      details: error.message 
    });
  }
}