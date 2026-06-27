let admin = null;
let firestoreAdmin = null;
let authAdmin = null;

try {
  admin = require('firebase-admin');
  firestoreAdmin = require('firebase-admin/firestore');
  authAdmin = require('firebase-admin/auth');
} catch {
  admin = null;
  firestoreAdmin = null;
  authAdmin = null;
}

let firebaseApp = null;

function requireFirebaseAdmin() {
  if (!admin) {
    throw new Error(
      'firebase-admin is not installed. Run npm install in the backend folder.',
    );
  }

  return admin;
}

function parseServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64',
    ).toString('utf8');

    return JSON.parse(json);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

function createCredential(firebaseAdmin, serviceAccount) {
  if (serviceAccount) {
    return typeof firebaseAdmin.cert === 'function'
      ? firebaseAdmin.cert(serviceAccount)
      : firebaseAdmin.credential.cert(serviceAccount);
  }

  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_USE_APPLICATION_DEFAULT === 'true'
  ) {
    return typeof firebaseAdmin.applicationDefault === 'function'
      ? firebaseAdmin.applicationDefault()
      : firebaseAdmin.credential.applicationDefault();
  }

  throw new Error(
    'Missing Firebase Admin credentials. Add FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY to backend/.env.',
  );
}

function getFirebaseApp() {
  const firebaseAdmin = requireFirebaseAdmin();

  if (firebaseApp) {
    return firebaseApp;
  }

  const existingApps =
    typeof firebaseAdmin.getApps === 'function'
      ? firebaseAdmin.getApps()
      : firebaseAdmin.apps || [];

  if (existingApps.length > 0) {
    firebaseApp =
      typeof firebaseAdmin.getApp === 'function'
        ? firebaseAdmin.getApp()
        : firebaseAdmin.app();
    return firebaseApp;
  }

  const serviceAccount = parseServiceAccount();
  const options = {};

  if (process.env.FIREBASE_PROJECT_ID) {
    options.projectId = process.env.FIREBASE_PROJECT_ID;
  }

  options.credential = createCredential(firebaseAdmin, serviceAccount);

  if (process.env.FIREBASE_DATABASE_URL) {
    options.databaseURL = process.env.FIREBASE_DATABASE_URL;
  }

  firebaseApp = firebaseAdmin.initializeApp(options);

  return firebaseApp;
}

function getFirestore() {
  const app = getFirebaseApp();

  if (firestoreAdmin?.getFirestore) {
    return firestoreAdmin.getFirestore(app);
  }

  return app.firestore();
}

function getFirebaseAuth() {
  const app = getFirebaseApp();

  if (authAdmin?.getAuth) {
    return authAdmin.getAuth(app);
  }

  return app.auth();
}

async function testFirebaseConnection() {
  await getFirestore().collection('_meta').limit(1).get();
  console.log('Firebase Firestore connected successfully');
}

module.exports = {
  getFirebaseAuth,
  getFirebaseApp,
  getFirestore,
  testFirebaseConnection,
};
