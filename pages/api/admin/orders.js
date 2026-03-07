// pages/api/admin/orders.js
// Fixed version - handles missing createdAt field

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
    console.log('📦 Fetching all orders...');
    
    // DON'T use orderBy - it skips documents without that field!
    // Just get ALL orders, we'll sort them in JavaScript
    const ordersSnap = await db.collection('orders')
      .limit(500)
      .get();

    console.log(`📊 Found ${ordersSnap.size} documents in Firestore`);

    const orders = [];
    
    ordersSnap.forEach(doc => {
      const data = doc.data();
      
      console.log(`📄 Processing order ${doc.id}:`, {
        hasCreatedAt: !!data.createdAt,
        hasCustomer: !!data.customer,
        hasCustomerName: !!data.customerName
      });
      
      // Extract customer - handle ALL formats
      let customer = null;
      
      if (data.customer && typeof data.customer === 'object') {
        customer = {
          name: data.customer.name || '',
          phone: data.customer.phone || '',
          address: data.customer.address || '',
          notes: data.customer.notes || ''
        };
      } else if (data.customerName || data.customerPhone) {
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
        
        // Handle missing createdAt gracefully
        createdAt: data.createdAt?.toDate?.()?.toISOString() || 
                   data.timestamp?.toDate?.()?.toISOString() ||
                   data.timestamp ||
                   new Date().toISOString(),
        
        items: (data.items || []).map(item => ({
          productName: item.productName || item.name || '',
          priceEach: item.priceEach || item.price || 0,
          quantity: item.quantity || item.qty || 1,
          unit: item.unit || ''
        }))
      };
      
      // Add customer if exists
      if (customer && (customer.name || customer.phone)) {
        order.customer = customer;
      }
      
      orders.push(order);
    });

    // Sort by date in JavaScript (after fetching all)
    orders.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Newest first
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