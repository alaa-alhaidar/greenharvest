// pages/api/diagnose-firestore.js
// Comprehensive Firestore diagnostic tool
// Visit: your-app.vercel.app/api/diagnose-firestore

export default async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    const { db } = await import('../../lib/firebase-admin');

    // Test 1: Simple query without any filters
    let test1 = { name: 'Simple Query (no orderBy)', status: 'running' };
    try {
      const snapshot1 = await db.collection('orders').get();
      test1.status = 'success';
      test1.count = snapshot1.size;
      test1.docIds = snapshot1.docs.map(d => d.id);
    } catch (err) {
      test1.status = 'failed';
      test1.error = err.message;
    }
    results.tests.push(test1);

    // Test 2: Query with limit
    let test2 = { name: 'Query with limit(100)', status: 'running' };
    try {
      const snapshot2 = await db.collection('orders').limit(100).get();
      test2.status = 'success';
      test2.count = snapshot2.size;
    } catch (err) {
      test2.status = 'failed';
      test2.error = err.message;
    }
    results.tests.push(test2);

    // Test 3: Query with orderBy
    let test3 = { name: 'Query with orderBy(createdAt)', status: 'running' };
    try {
      const snapshot3 = await db.collection('orders').orderBy('createdAt', 'desc').limit(100).get();
      test3.status = 'success';
      test3.count = snapshot3.size;
    } catch (err) {
      test3.status = 'failed';
      test3.error = err.message;
      test3.note = 'This is probably the issue - orderBy might require an index or createdAt field is missing';
    }
    results.tests.push(test3);

    // Test 4: Sample documents analysis
    let test4 = { name: 'Sample Documents Analysis', status: 'running' };
    try {
      const sampleSnapshot = await db.collection('orders').limit(3).get();
      test4.status = 'success';
      test4.samples = sampleSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          hasCreatedAt: !!data.createdAt,
          createdAtType: typeof data.createdAt,
          hasCustomer: !!data.customer,
          hasItems: !!data.items,
          hasTotal: !!data.total,
          hasStatus: !!data.status,
          fields: Object.keys(data)
        };
      });
    } catch (err) {
      test4.status = 'failed';
      test4.error = err.message;
    }
    results.tests.push(test4);

    // Test 5: Full document example (first order only)
    let test5 = { name: 'Full First Order Example', status: 'running' };
    try {
      const firstDoc = await db.collection('orders').limit(1).get();
      if (firstDoc.size > 0) {
        const doc = firstDoc.docs[0];
        const data = doc.data();
        test5.status = 'success';
        test5.document = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || 'missing'
        };
      } else {
        test5.status = 'warning';
        test5.message = 'No orders found in collection';
      }
    } catch (err) {
      test5.status = 'failed';
      test5.error = err.message;
    }
    results.tests.push(test5);

    // Overall summary
    const allPassed = results.tests.every(t => t.status === 'success');
    results.summary = {
      allTestsPassed: allPassed,
      recommendation: allPassed 
        ? 'All tests passed. Dashboard should work. Try clearing browser cache.'
        : 'Some tests failed. Check details above. Most likely: orderBy(createdAt) is failing.'
    };

  } catch (err) {
    results.error = {
      message: 'Failed to initialize Firebase',
      details: err.message
    };
  }

  res.status(200).json(results);
}