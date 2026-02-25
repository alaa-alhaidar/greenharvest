# 🌿 GreenHarvest — Secure Order App

Next.js + Firebase Admin + WhatsApp ordering app.
The browser **never** writes to Firestore directly — all orders go through a secure server-side API route.

---

## 🏗 Architecture

```
Browser  →  POST /api/order  →  Firebase Admin SDK  →  Firestore
              (Next.js API route — server only)
```

The browser only sends: customer info + product IDs + quantities.
The server looks up real prices, validates everything, then writes to Firestore.

---

## 🚀 Setup

### 1. Install
```bash
npm install
```

### 2. Create Firebase Service Account
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select your project → **Project Settings** → **Service Accounts**
3. Click **"Generate New Private Key"** → download the JSON file
4. Also enable **Firestore Database** (test mode is fine to start)

### 3. Configure environment
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in from the downloaded JSON:
```
FIREBASE_PROJECT_ID      → "project_id"    field in the JSON
FIREBASE_CLIENT_EMAIL    → "client_email"  field in the JSON
FIREBASE_PRIVATE_KEY     → "private_key"   field in the JSON
NEXT_PUBLIC_WHATSAPP_NUMBER → your number (no + or spaces, e.g. 49170123456)
NEXT_PUBLIC_STORE_NAME      → your store name
```

### 4. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variables — **use these exact names**:

| Variable | Where to find it |
|---|---|
| `FIREBASE_PROJECT_ID` | JSON → `project_id` |
| `FIREBASE_CLIENT_EMAIL` | JSON → `client_email` |
| `FIREBASE_PRIVATE_KEY` | JSON → `private_key` (copy the whole value including `-----BEGIN...`) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Your WhatsApp number |
| `NEXT_PUBLIC_STORE_NAME` | Your store name |

> ⚠️ **Important for `FIREBASE_PRIVATE_KEY` on Vercel:**
> Paste the value exactly as it appears in the JSON file, including all `\n` characters.
> Vercel stores it correctly — the code handles the newline conversion automatically.

4. Click **Deploy** ✅

---

## 🔒 Security layers in `/api/order`

| Layer | What it does |
|---|---|
| Method guard | Only `POST` requests accepted |
| Rate limiting | Max 5 orders per IP per 10 minutes |
| Input validation | All fields validated server-side |
| Price whitelist | Prices come from server `products.js`, browser prices are ignored |
| Payload size | Next.js default 4MB cap on request body |
| IP logging | IP + user-agent stored for abuse tracking |
| Server timestamp | `createdAt` set by Firestore server, not client |

---

## ✏️ What to change

| What | File |
|---|---|
| Products, prices, categories | `lib/products.js` |
| WhatsApp number / store name | Vercel env vars or `.env.local` |
| Security rules (rate limit) | `pages/api/order.js` — top constants |
| Page layout / design | `pages/index.js` |

---

## 🔥 Firestore Rules (lock down for production)

In Firebase Console → Firestore → Rules, set:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only the Admin SDK (server) can write orders
    // Browser cannot read or write anything
    match /orders/{orderId} {
      allow read, write: if false;
    }
  }
}
```
This blocks all browser access completely. Your server uses the Admin SDK which bypasses these rules entirely.

---

## 📦 Order structure in Firestore
```json
{
  "customer": { "name": "...", "phone": "...", "address": "...", "notes": "..." },
  "items": [{ "id": "p1", "name": "...", "price": 12.99, "qty": 2 }],
  "total": 25.98,
  "status": "new",
  "paymentMethod": "cash_on_delivery",
  "createdAt": "<server timestamp>",
  "meta": { "ip": "...", "userAgent": "..." }
}
```
# greenharvest
