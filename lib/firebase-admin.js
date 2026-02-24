// lib/firebase-admin.js
// ─────────────────────────────────────────────────────────────────
// SERVER ONLY — never imported by the browser.
// Uses Firebase Admin SDK with a service account.
// These env vars have NO "NEXT_PUBLIC_" prefix so they are
// never sent to the client.
// ─────────────────────────────────────────────────────────────────
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:    process.env.FIREBASE_PROJECT_ID,
      clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel stores multi-line secrets as escaped \n — fix that:
      privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export { db };
