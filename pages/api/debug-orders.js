// pages/api/debug-orders.js
// Simple page to test if orders API is working
// Visit: your-app.vercel.app/api/debug-orders?secret=YOUR_ADMIN_SECRET

export default async function handler(req, res) {
  const { secret } = req.query;

  if (!secret) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Debug Orders</title></head>
      <body style="font-family: monospace; padding: 20px;">
        <h1>Debug Orders API</h1>
        <p>Add your ADMIN_SECRET to the URL:</p>
        <code>?secret=YOUR_ADMIN_SECRET_HERE</code>
      </body>
      </html>
    `);
  }

  // Test 1: Check environment variables
  const adminSecret = process.env.ADMIN_SECRET;
  const hasAdminSecret = !!adminSecret;

  // Test 2: Try to fetch orders
  let ordersResponse = null;
  let ordersError = null;

  try {
    const { db } = await import('../../lib/firebase-admin');
    
    const snapshot = await db
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        shortId: doc.id.slice(-6).toUpperCase(),
        customer: data.customer,
        items: data.items,
        total: data.total,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    ordersResponse = { count: orders.length, orders };
  } catch (err) {
    ordersError = { message: err.message, code: err.code };
  }

  // Test 3: Check if secret matches
  const secretMatches = secret === adminSecret;

  // Generate HTML response
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Debug Orders</title>
      <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        .test { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ccc; }
        .test.pass { border-left-color: #4caf50; }
        .test.fail { border-left-color: #f44336; }
        .status { font-weight: bold; font-size: 18px; }
        .pass .status { color: #4caf50; }
        .fail .status { color: #f44336; }
        pre { background: #f0f0f0; padding: 10px; overflow: auto; border-radius: 4px; }
        h1 { color: #333; }
        .summary { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>🔍 Orders API Debug Report</h1>
      
      <div class="summary">
        <strong>Summary:</strong><br>
        ${ordersResponse ? `✅ Found ${ordersResponse.count} orders in Firestore` : '❌ Failed to fetch orders'}
      </div>

      <div class="test ${hasAdminSecret ? 'pass' : 'fail'}">
        <div class="status">${hasAdminSecret ? '✅' : '❌'} ADMIN_SECRET Environment Variable</div>
        <p>${hasAdminSecret ? 'ADMIN_SECRET is set' : 'ADMIN_SECRET is NOT set'}</p>
      </div>

      <div class="test ${secretMatches ? 'pass' : 'fail'}">
        <div class="status">${secretMatches ? '✅' : '❌'} Secret Match</div>
        <p>${secretMatches ? 'Your secret matches ADMIN_SECRET' : 'Your secret does NOT match ADMIN_SECRET'}</p>
        ${!secretMatches ? '<p><strong>Try:</strong> Make sure you copied the ADMIN_SECRET exactly from Vercel (case-sensitive)</p>' : ''}
      </div>

      <div class="test ${ordersResponse ? 'pass' : 'fail'}">
        <div class="status">${ordersResponse ? '✅' : '❌'} Firestore Connection</div>
        ${ordersResponse 
          ? `<p>Successfully fetched <strong>${ordersResponse.count}</strong> orders from Firestore</p>`
          : `<p>Failed to fetch orders</p><pre>${JSON.stringify(ordersError, null, 2)}</pre>`
        }
      </div>

      ${ordersResponse ? `
        <div class="test pass">
          <div class="status">📦 Orders Data</div>
          <p>Here are your orders:</p>
          <pre>${JSON.stringify(ordersResponse.orders, null, 2)}</pre>
        </div>
      ` : ''}

      <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 8px;">
        <strong>Next Steps:</strong>
        <ol>
          <li>If all tests pass ✅, your backend is working correctly</li>
          <li>If orders count is correct but dashboard shows nothing, clear browser cache</li>
          <li>Open browser console (F12) on admin dashboard and check for JavaScript errors</li>
          <li>Try logging out and back into the admin dashboard</li>
        </ol>
      </div>
    </body>
    </html>
  `);
}