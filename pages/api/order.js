// pages/api/order.js
// ─────────────────────────────────────────────────────────────────
// SERVER-SIDE ONLY — runs in Node.js on Vercel, never in the browser.
//
// Security layers:
//  1. CORS             — only requests from your own domain allowed
//  2. Method guard     — only POST accepted
//  3. API secret       — secret header required on every request
//  4. Rate limiting    — max 5 orders per IP per 10 minutes
//  5. XSS sanitization — strips all HTML/script tags from text inputs
//  6. Input validation — all fields validated server-side
//  7. Price whitelist  — prices come from server products.js, never the browser
//  8. Server timestamp — createdAt set by Firestore, not the client
// ─────────────────────────────────────────────────────────────────
import { db } from '../../lib/firebase-admin';
import { products } from '../../lib/products';
import { FieldValue } from 'firebase-admin/firestore';

// ── 1. CORS ───────────────────────────────────────────────────────
function setCorsHeaders(req, res) {
  const origin  = req.headers.origin || '';
  const allowed = process.env.NEXT_PUBLIC_APP_URL || '';

  // In development allow localhost; in production allow only your domain
  const isDev         = process.env.NODE_ENV === 'development';
  const isAllowed     = isDev || origin === allowed;

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin',  origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-secret');
  }
  return isAllowed;
}

// ── 2. Rate limiter (in-memory, resets on cold start) ─────────────
// Good enough for a small shop. Upgrade to Upstash Redis for high traffic.
const rateLimitMap   = new Map(); // ip → { count, resetAt }
const RATE_LIMIT     = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── 3. XSS sanitizer — strips all HTML tags and dangerous chars ───
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')        // remove HTML tags
    .replace(/[<>'"]/g, '')         // remove remaining dangerous chars
    .replace(/javascript:/gi, '')   // block javascript: URIs
    .replace(/on\w+\s*=/gi, '')     // block inline event handlers
    .trim();
}

// ── 4. Validation helpers ─────────────────────────────────────────
function isNonEmptyString(val, maxLen = 500) {
  return typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen;
}

function isValidPhone(val) {
  return typeof val === 'string' && /^[\d\s\+\-\(\)]{6,20}$/.test(val.trim());
}

// ── Main handler ──────────────────────────────────────────────────
export default async function handler(req, res) {

  // Handle CORS preflight
  const corsOk = setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Block cross-origin requests (except in dev)
  if (!corsOk && process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API secret header
  const secret = process.env.API_SECRET;
  if (secret && req.headers['x-api-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many orders. Please wait a few minutes.' });
  }

  // Parse body
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { customer, items } = body;

  // Validate + sanitize customer fields
  const customerErrors = {};
  if (!isNonEmptyString(customer?.name, 100))       customerErrors.name    = 'Name is required';
  if (!isValidPhone(customer?.phone))               customerErrors.phone   = 'Valid phone number is required';
  if (!isNonEmptyString(customer?.address, 300))    customerErrors.address = 'Address is required';
  if (customer?.notes && customer.notes.length > 500) customerErrors.notes = 'Notes too long';

  if (Object.keys(customerErrors).length > 0) {
    return res.status(422).json({ error: 'Validation failed', fields: customerErrors });
  }

  // Validate items
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

    // Price comes from SERVER list — browser-sent prices are completely ignored
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
      price: product.price, // ← server price only
      qty,
    });
  }

  // Compute total server-side
  const total = Math.round(
    validatedItems.reduce((sum, i) => sum + i.price * i.qty, 0) * 100
  ) / 100;

  // Write to Firestore via Admin SDK
  try {
    const docRef = await db.collection('orders').add({
      customer: {
        name:    stripHtml(customer.name),
        phone:   customer.phone.trim(),
        address: stripHtml(customer.address),
        notes:   stripHtml(customer.notes || ''),
      },
      items:         validatedItems,
      total,
      status:        'new',
      paymentMethod: 'cash_on_delivery',
      createdAt:     FieldValue.serverTimestamp(),
      meta: {
        ip,
        userAgent: req.headers['user-agent']?.slice(0, 200) || '',
      },
    });

    const shortId = docRef.id.slice(-6).toUpperCase();
    return res.status(200).json({ success: true, orderId: shortId, total });

  } catch (err) {
    console.error('Firestore write error:', err);
    return res.status(500).json({ error: 'Failed to save order. Please try again.' });
  }
}