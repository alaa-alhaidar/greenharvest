// pages/api/order.js
// Place order endpoint with automatic stock deduction
// Protected by API_SECRET

import { db } from '../../lib/firebase-admin';
import { products } from '../../lib/products';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API secret
  const secret = process.env.API_SECRET;
  if (!secret || req.headers['x-api-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { customer, items } = req.body;

  // Validate customer
  if (!customer || !customer.name || !customer.phone || !customer.address) {
    return res.status(422).json({
      error: 'Missing required fields',
      fields: {
        name: !customer?.name ? 'Name is required' : null,
        phone: !customer?.phone ? 'Phone is required' : null,
        address: !customer?.address ? 'Address is required' : null,
      }
    });
  }

  // Validate items
  if (!items || !items.length) {
    return res.status(422).json({ error: 'Cart is empty' });
  }

  try {
    // Check stock availability BEFORE placing order
    const inventoryChecks = await Promise.all(
      items.map(async item => {
        const product = products.find(p => p.id === item.id);
        if (!product) {
          return { id: item.id, error: 'Product not found' };
        }

        // Get current stock from Firestore
        const stockRef = db.collection('inventory').doc(item.id);
        const stockDoc = await stockRef.get();
        const currentStock = stockDoc.exists 
          ? (stockDoc.data().stock || 0)
          : product.stock; // Fallback to catalog default

        // Check if enough stock
        if (currentStock < item.qty) {
          return {
            id: item.id,
            name: product.name,
            requested: item.qty,
            available: currentStock,
            error: 'Insufficient stock'
          };
        }

        return { id: item.id, name: product.name, available: currentStock, ok: true };
      })
    );

    // Check if any items have stock issues
    const stockIssues = inventoryChecks.filter(check => check.error);
    if (stockIssues.length > 0) {
      return res.status(400).json({
        error: 'Some items are out of stock',
        details: stockIssues
      });
    }

    // Build order with server-validated prices
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) throw new Error('Product not found: ' + item.id);

      return {
        productId: item.id,
        productName: product.name,
        quantity: item.qty,
        priceEach: product.price,
        unit: product.unit || '',
      };
    });

    const total = orderItems.reduce((sum, item) => {
      return sum + (item.priceEach * item.quantity);
    }, 0);

    // Create order in Firestore
    const orderRef = await db.collection('orders').add({
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerNotes: customer.notes || '',
      items: orderItems,
      total: total,
      status: 'new',
      paymentMethod: 'cash_on_delivery',
      createdAt: new Date(),
      timestamp: Date.now(),
    });

    // DEDUCT STOCK for each item
    await Promise.all(
      items.map(async item => {
        const stockRef = db.collection('inventory').doc(item.id);
        const stockDoc = await stockRef.get();
        const product = products.find(p => p.id === item.id);
        
        const currentStock = stockDoc.exists 
          ? (stockDoc.data().stock || 0)
          : product.stock;

        const newStock = Math.max(0, currentStock - item.qty);

        // Update stock
        await stockRef.set({
          productId: item.id,
          stock: newStock,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'order_system',
        }, { merge: true });

        // Log stock change
        await db.collection('stockHistory').add({
          productId: item.id,
          action: 'subtract',
          quantity: item.qty,
          previousStock: currentStock,
          newStock: newStock,
          orderId: orderRef.id,
          timestamp: new Date().toISOString(),
          updatedBy: 'order_system',
          reason: 'order_placed',
        });
      })
    );

    return res.status(200).json({
      success: true,
      orderId: orderRef.id,
      total: total,
      message: 'Order placed successfully',
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({
      error: 'Failed to create order',
      details: error.message
    });
  }
}