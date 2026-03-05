 // lib/products.js
// Product catalog with inventory management

export const categories = [
  { id: 'all',     label: 'All Products',    icon: '🌿' },
  { id: 'honey',   label: 'Honey',           icon: '🍯' },
  { id: 'oils',    label: 'Oils',            icon: '🫒' },
  { id: 'herbs',   label: 'Herbs & Spices',  icon: '🌿' },
  { id: 'organic', label: 'Organic',         icon: '🌱' },
];

export const products = [
  // Honey
  {
    id: 'manuka-500',
    name: 'Manuka Honey',
    category: 'honey',
    price: 29.99,
    origin: 'New Zealand',
    stars: 4.9,
    reviews: 127,
    emoji: '🍯',
    bg: '#FFF4E6',
    badge: 'organic',
    unit: '500g',
    // INVENTORY FIELDS
    stock: 45,              // Current stock quantity
    lowStockThreshold: 10,  // Alert when stock falls below this
    reorderPoint: 5,        // Suggest reorder at this point
    maxStock: 100,          // Maximum stock capacity
    sku: 'MH-500',          // Stock Keeping Unit
  },
  {
    id: 'thyme-honey-250',
    name: 'Thyme Honey',
    category: 'honey',
    price: 24.99,
    origin: 'Syria',
    stars: 4.8,
    reviews: 98,
    emoji: '🍯',
    bg: '#FFF9E6',
    badge: 'new',
    unit: '250g',
    stock: 3,               // Low stock!
    lowStockThreshold: 10,
    reorderPoint: 5,
    maxStock: 80,
    sku: 'TH-250',
  },
  {
    id: 'wildflower-honey',
    name: 'Wildflower Honey',
    category: 'honey',
    price: 19.99,
    origin: 'Lebanon',
    stars: 4.7,
    reviews: 84,
    emoji: '🌸',
    bg: '#FFF0F5',
    unit: '350g',
    stock: 0,               // Out of stock!
    lowStockThreshold: 8,
    reorderPoint: 5,
    maxStock: 60,
    sku: 'WH-350',
  },

  // Oils
  {
    id: 'olive-oil-1l',
    name: 'Extra Virgin Olive Oil',
    category: 'oils',
    price: 34.99,
    origin: 'Syria',
    stars: 4.9,
    reviews: 156,
    emoji: '🫒',
    bg: '#F0F8E8',
    badge: 'organic',
    unit: '1L',
    stock: 67,
    lowStockThreshold: 15,
    reorderPoint: 10,
    maxStock: 120,
    sku: 'OO-1L',
  },
  {
    id: 'sesame-oil',
    name: 'Cold-Pressed Sesame Oil',
    category: 'oils',
    price: 18.99,
    origin: 'Lebanon',
    stars: 4.6,
    reviews: 72,
    emoji: '🌰',
    bg: '#FFF8DC',
    unit: '500ml',
    stock: 28,
    lowStockThreshold: 12,
    reorderPoint: 8,
    maxStock: 70,
    sku: 'SO-500',
  },
  {
    id: 'nigella-oil',
    name: 'Black Seed Oil',
    category: 'oils',
    price: 22.99,
    origin: 'Syria',
    stars: 4.8,
    reviews: 91,
    emoji: '⚫',
    bg: '#F5F5DC',
    badge: 'organic',
    unit: '250ml',
    stock: 15,
    lowStockThreshold: 10,
    reorderPoint: 6,
    maxStock: 50,
    sku: 'NS-250',
  },

  // Herbs & Spices
  {
    id: 'zaatar-mix',
    name: "Za'atar Mix",
    category: 'herbs',
    price: 12.99,
    origin: 'Syria',
    stars: 4.9,
    reviews: 142,
    emoji: '🌿',
    bg: '#F0FFF0',
    badge: 'organic',
    unit: '200g',
    stock: 52,
    lowStockThreshold: 15,
    reorderPoint: 10,
    maxStock: 100,
    sku: 'ZT-200',
  },
  {
    id: 'sumac',
    name: 'Ground Sumac',
    category: 'herbs',
    price: 9.99,
    origin: 'Lebanon',
    stars: 4.7,
    reviews: 68,
    emoji: '🔴',
    bg: '#FFF0F0',
    unit: '150g',
    stock: 8,              // Low stock!
    lowStockThreshold: 12,
    reorderPoint: 8,
    maxStock: 60,
    sku: 'SM-150',
  },
  {
    id: 'dried-mint',
    name: 'Dried Mint Leaves',
    category: 'herbs',
    price: 8.99,
    origin: 'Syria',
    stars: 4.6,
    reviews: 55,
    emoji: '🍃',
    bg: '#F0FFF4',
    unit: '100g',
    stock: 34,
    lowStockThreshold: 10,
    reorderPoint: 6,
    maxStock: 80,
    sku: 'DM-100',
  },

  // Organic
  {
    id: 'organic-dates',
    name: 'Organic Medjool Dates',
    category: 'organic',
    price: 16.99,
    origin: 'Palestine',
    stars: 4.8,
    reviews: 103,
    emoji: '🌴',
    bg: '#F5E6D3',
    badge: 'organic',
    unit: '500g',
    stock: 41,
    lowStockThreshold: 12,
    reorderPoint: 8,
    maxStock: 90,
    sku: 'OD-500',
  },
  {
    id: 'organic-almonds',
    name: 'Raw Organic Almonds',
    category: 'organic',
    price: 14.99,
    origin: 'Lebanon',
    stars: 4.7,
    reviews: 89,
    emoji: '🌰',
    bg: '#FAEBD7',
    badge: 'organic',
    unit: '400g',
    stock: 2,              // Very low stock!
    lowStockThreshold: 10,
    reorderPoint: 5,
    maxStock: 70,
    sku: 'OA-400',
  },
  {
    id: 'organic-apricots',
    name: 'Dried Organic Apricots',
    category: 'organic',
    price: 13.99,
    origin: 'Syria',
    stars: 4.9,
    reviews: 118,
    emoji: '🍑',
    bg: '#FFE4B5',
    badge: 'organic',
    unit: '300g',
    stock: 56,
    lowStockThreshold: 15,
    reorderPoint: 10,
    maxStock: 100,
    sku: 'OAP-300',
  },
];

// Helper functions for inventory
export function getProductById(id) {
  return products.find(p => p.id === id);
}

export function getLowStockProducts() {
  return products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold);
}

export function getOutOfStockProducts() {
  return products.filter(p => p.stock === 0);
}

export function getInStockProducts() {
  return products.filter(p => p.stock > 0);
}

export function getStockStatus(product) {
  if (product.stock === 0) return 'out';
  if (product.stock <= product.reorderPoint) return 'critical';
  if (product.stock <= product.lowStockThreshold) return 'low';
  return 'good';
}

export function getStockStatusLabel(product) {
  const status = getStockStatus(product);
  const labels = {
    out: 'غير متوفر',
    critical: 'شبه نفذ',
    low: 'مخزون قليل',
    good: 'متوفر',
  };
  return labels[status];
}

export function getStockStatusEmoji(product) {
  const status = getStockStatus(product);
  const emojis = {
    out: '❌',
    critical: '🔴',
    low: '⚠️',
    good: '✅',
  };
  return emojis[status];
}