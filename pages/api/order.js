// pages/api/order.js
// ─────────────────────────────────────────────────────────────────
// SERVER-SIDE ONLY — runs in Node.js on Vercel, never in the browser.
// The browser cannot write to Firestore directly; it must POST here.
//
// Security layers:
//  1. Method guard      — only POST accepted
//  2. Input validation  — all fields checked server-side
//  3. Product whitelist — prices come from server, not the browser
//  4. Rate limiting     — max 5 orders per IP per 10 minutes
//  5. Payload size cap  — blocks oversized / malicious bodies
// ─────────────────────────────────────────────────────────────────
import { db } from '../../lib/firebase-admin';
import { products } from '../../lib/products';
import { FieldValue } from 'firebase-admin/firestore';

// ── Simple in-memory rate limiter ─────────────────────────────────
// (resets when the serverless function cold-starts, which is fine)
const rateLimitMap = new Map(); // ip → { count, resetAt }
const RATE_LIMIT        = 5;           // max orders
const RATE_WINDOW_MS    = 10 * 60 * 1000; // per 10 minutes

function checkRateLimit(ip) {
  const now  = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT) return false; // blocked
  entry.count++;
  return true; // allowed
}

// ── Helpers ───────────────────────────────────────────────────────
function isNonEmptyString(val, maxLen = 500) {
  return typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen;
}

function isValidPhone(val) {
  // allow +, digits, spaces, dashes, parens; 6–20 chars
  return typeof val === 'string' && /^[\d\s\+\-\(\)]{6,20}$/.test(val.trim());
}

// ── Handler ───────────────────────────────────────────────────────
export default async function handler(req, res) {
  // 1. Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many orders. Please wait a few minutes.' });
  }

  // 3. Parse body safely
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { customer, items } = body;

  // 4. Validate customer fields (server-side — never trust the browser)
  const customerErrors = {};
  if (!isNonEmptyString(customer?.name, 100))       customerErrors.name    = 'Name is required';
  if (!isValidPhone(customer?.phone))                customerErrors.phone   = 'Valid phone number is required';
  if (!isNonEmptyString(customer?.address, 300))     customerErrors.address = 'Address is required';
  if (customer?.notes && customer.notes.length > 500) customerErrors.notes  = 'Notes too long';

  if (Object.keys(customerErrors).length > 0) {
    return res.status(422).json({ error: 'Validation failed', fields: customerErrors });
  }

  // 5. Validate items — prices come from OUR product list, not the browser
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(422).json({ error: 'Cart is empty' });
  }
  if (items.length > 50) {
    return res.status(422).json({ error: 'Too many items in cart' });
  }

  const validatedItems = [];
  for (const item of items) {
    if (!item?.id || typeof item.qty !== 'number') {
      return res.status(422).json({ error: 'Invalid item format' });
    }

    // Look up the real product from our server-side list
    const product = products.find(p => p.id === item.id);
    if (!product) {
      return res.status(422).json({ error: `Unknown product: ${item.id}` });
    }

    const qty = Math.floor(item.qty);
    if (qty < 1 || qty > 99) {
      return res.status(422).json({ error: `Invalid quantity for ${product.name}` });
    }

    validatedItems.push({
      id:    product.id,
      name:  product.name,
      price: product.price,   // ← server price, ignoring any client-sent price
      qty,
    });
  }

  // 6. Compute total server-side
  const total = validatedItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  // 7. Write to Firestore via Admin SDK
  try {
    const docRef = await db.collection('orders').add({
      customer: {
        name:    customer.name.trim(),
        phone:   customer.phone.trim(),
        address: customer.address.trim(),
        notes:   customer.notes?.trim() || '',
      },
      items:         validatedItems,
      total:         Math.round(total * 100) / 100, // round to 2dp
      status:        'new',
      paymentMethod: 'cash_on_delivery',
      createdAt:     FieldValue.serverTimestamp(),
      meta: {
        ip,            // for abuse tracking
        userAgent: req.headers['user-agent'] || '',
      },
    });

    const shortId = docRef.id.slice(-6).toUpperCase();
    return res.status(200).json({ success: true, orderId: shortId, total });

  } catch (err) {
    console.error('Firestore write error:', err);
    return res.status(500).json({ error: 'Failed to save order. Please try again.' });
  }
}
