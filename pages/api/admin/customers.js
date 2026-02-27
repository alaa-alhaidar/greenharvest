// pages/api/admin/customers.js
// Fetches customer list with order history for follow-up
// Protected by ADMIN_SECRET env var.

import { db } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check admin secret
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const snapshot = await db.collection('orders').get();

    // Group orders by customer
    const customerMap = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Extract customer info (handle both formats)
      const name = data.customerName || data.customer?.name || 'Unknown';
      const phone = data.customerPhone || data.customer?.phone || '';
      const address = data.customerAddress || data.customer?.address || '';
      const whatsapp = data.customerWhatsApp || data.customer?.whatsapp || phone;
      
      // Calculate order total
      const total = data.total || 0;
      
      // Use phone as unique identifier (fallback to name if no phone)
      const key = phone || name;
      
      if (!customerMap[key]) {
        customerMap[key] = {
          name,
          phone,
          address,
          whatsapp,
          orderCount: 0,
          totalSpent: 0,
          orders: [],
          lastOrderDate: null
        };
      }
      
      // Add order info
      customerMap[key].orderCount++;
      customerMap[key].totalSpent += total;
      
      const orderDate = data.createdAt?.toDate?.() 
                        || (data.timestamp ? new Date(data.timestamp) : null);
      
      customerMap[key].orders.push({
        id: doc.id,
        shortId: doc.id.slice(-6).toUpperCase(),
        total,
        status: (data.status || 'new').toLowerCase(),
        date: orderDate?.toISOString() || null
      });
      
      // Update last order date
      if (orderDate && (!customerMap[key].lastOrderDate || orderDate > customerMap[key].lastOrderDate)) {
        customerMap[key].lastOrderDate = orderDate;
      }
    });

    // Convert to array and sort by total spent (highest first)
    const customers = Object.values(customerMap)
      .map(c => ({
        ...c,
        lastOrderDate: c.lastOrderDate?.toISOString() || null
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return res.status(200).json({ customers });
  } catch (err) {
    console.error('Customers fetch error:', err);
    return res.status(500).json({ 
      error: 'Failed to fetch customers',
      details: err.message 
    });
  }
}