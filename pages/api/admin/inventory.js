 // pages/api/admin/inventory.js
// Fetch inventory data
// Protected by ADMIN_SECRET

import { db } from '../../../lib/firebase-admin';
import { products } from '../../../lib/products';

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
    // Fetch inventory from Firestore
    const inventorySnap = await db.collection('inventory').get();
    const inventoryMap = {};
    
    inventorySnap.forEach(doc => {
      const data = doc.data();
      inventoryMap[doc.id] = data.stock || 0;
    });

    // Merge with products catalog
    const inventory = products.map(product => {
      // Use Firestore stock if available, otherwise use default from products.js
      const currentStock = inventoryMap[product.id] !== undefined 
        ? inventoryMap[product.id] 
        : product.stock;

      let status = 'good';
      if (currentStock === 0) status = 'out';
      else if (currentStock <= product.reorderPoint) status = 'critical';
      else if (currentStock <= product.lowStockThreshold) status = 'low';

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        price: product.price,
        stock: currentStock,
        lowStockThreshold: product.lowStockThreshold,
        reorderPoint: product.reorderPoint,
        maxStock: product.maxStock,
        status,
        category: product.category,
      };
    });

    // Calculate summary stats
    const summary = {
      totalProducts: inventory.length,
      inStock: inventory.filter(p => p.stock > 0).length,
      outOfStock: inventory.filter(p => p.stock === 0).length,
      lowStock: inventory.filter(p => p.status === 'low' || p.status === 'critical').length,
      totalValue: inventory.reduce((sum, p) => sum + (p.stock * p.price), 0),
    };

    return res.status(200).json({
      inventory,
      summary,
    });

  } catch (error) {
    console.error('Inventory fetch error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch inventory',
      details: error.message 
    });
  }
}