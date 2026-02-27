// pages/api/admin/orders.js
// Server-side only — fetches all orders from Firestore.
// Protected by ADMIN_SECRET env var.
// UPDATED: Transforms Android app data structure to dashboard format

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
    // Fetch without orderBy to avoid index issues
    const snapshot = await db
      .collection('orders')
      .limit(100)
      .get();

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Transform Android app structure to dashboard structure
      const transformedOrder = {
        id: doc.id,
        shortId: doc.id.slice(-6).toUpperCase(),
        
        // Transform customer data
        customer: {
          name: data.customerName || data.customer?.name || '',
          phone: data.customerPhone || data.customer?.phone || '',
          address: data.customerAddress || data.customer?.address || '',
          notes: data.note || data.notes || data.customer?.notes || '',
          whatsapp: data.customerWhatsApp || data.customer?.whatsapp || ''
        },
        
        // Transform items array
        items: (data.items || []).map(item => ({
          id: item.productId?.toString() || item.id || '',
          name: item.productName || item.name || 'Product',
          price: item.priceEach || item.price || 0,
          qty: item.quantity || item.qty || 1,
          unit: item.unit || ''
        })),
        
        // Other fields
        total: data.total || 0,
        status: (data.status || 'new').toLowerCase(),
        paymentMethod: data.paymentMethod || 'cash_on_delivery',
        
        // Handle timestamps
        createdAt: data.createdAt?.toDate?.()?.toISOString() 
                   || (data.timestamp ? new Date(data.timestamp).toISOString() : null)
      };

      return transformedOrder;
    });

    // Sort by createdAt (newer first)
    orders.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({ orders });
  } catch (err) {
    console.error('Admin fetch error:', err);
    return res.status(500).json({ 
      error: 'Failed to fetch orders',
      details: err.message 
    });
  }
}