// pages/api/test-env.js
// Diagnostic endpoint - tells you exactly what's wrong
// Access at: yourapp.vercel.app/api/test-env

export default async function handler(req, res) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    checks: []
  };

  // 1. Check ADMIN_SECRET
  const adminSecret = process.env.ADMIN_SECRET;
  diagnostics.checks.push({
    name: 'ADMIN_SECRET',
    status: adminSecret ? '✅ SET' : '❌ MISSING',
    length: adminSecret ? adminSecret.length : 0
  });

  // 2. Check Firebase vars
  const fbProjectId = process.env.FIREBASE_PROJECT_ID;
  const fbClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const fbPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  diagnostics.checks.push({
    name: 'FIREBASE_PROJECT_ID',
    status: fbProjectId ? '✅ SET' : '❌ MISSING',
    value: fbProjectId ? fbProjectId.substring(0, 20) + '...' : 'not set'
  });

  diagnostics.checks.push({
    name: 'FIREBASE_CLIENT_EMAIL',
    status: fbClientEmail ? '✅ SET' : '❌ MISSING',
    value: fbClientEmail ? fbClientEmail.substring(0, 30) + '...' : 'not set'
  });

  diagnostics.checks.push({
    name: 'FIREBASE_PRIVATE_KEY',
    status: fbPrivateKey ? '✅ SET' : '❌ MISSING',
    length: fbPrivateKey ? fbPrivateKey.length : 0,
    startsCorrectly: fbPrivateKey ? fbPrivateKey.includes('BEGIN PRIVATE KEY') : false
  });

  // 3. Test Firebase connection
  let firebaseTest = { status: 'NOT_TESTED', error: null };
  
  try {
    const { db } = await import('../../lib/firebase-admin');
    
    // Try to read from Firestore
    const testRef = await db.collection('orders').limit(1).get();
    
    firebaseTest = {
      status: '✅ CONNECTED',
      canReadFirestore: true,
      ordersCount: testRef.size
    };
  } catch (err) {
    firebaseTest = {
      status: '❌ FAILED',
      error: err.message,
      errorCode: err.code || 'unknown'
    };
  }

  diagnostics.firebaseConnection = firebaseTest;

  // 4. Overall status
  const allEnvSet = adminSecret && fbProjectId && fbClientEmail && fbPrivateKey;
  const firebaseWorks = firebaseTest.status === '✅ CONNECTED';

  diagnostics.summary = {
    environmentVariables: allEnvSet ? '✅ All set' : '❌ Some missing',
    firebaseConnection: firebaseWorks ? '✅ Working' : '❌ Not working',
    readyForProduction: allEnvSet && firebaseWorks
  };

  return res.status(200).json(diagnostics);
}
