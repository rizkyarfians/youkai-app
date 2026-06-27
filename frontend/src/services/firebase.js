import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyC6t7-o0MSe0PjfvaS3a82oUetd_GJhOzY',
  authDomain: 'youkai-management-app.firebaseapp.com',
  projectId: 'youkai-management-app',
  storageBucket: 'youkai-management-app.firebasestorage.app',
  messagingSenderId: '1075005176871',
  appId: '1:1075005176871:web:88822989555572b30a2202',
  measurementId: 'G-042Y5JEMHF',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    defaultFirebaseConfig.measurementId,
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
const firebaseAnalytics = firebaseApp
  ? isAnalyticsSupported()
      .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
      .catch(() => null)
  : Promise.resolve(null);

async function getIdToken() {
  if (!firebaseAuth?.currentUser) {
    return null;
  }

  return firebaseAuth.currentUser.getIdToken();
}

export {
  firebaseAnalytics,
  firebaseApp,
  firebaseAuth,
  firebaseConfig,
  getIdToken,
  hasFirebaseConfig,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
};
