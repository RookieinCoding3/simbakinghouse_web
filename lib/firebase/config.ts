import { initializeApp, getApps, getApp } from 'firebase/app'
import { initializeFirestore, getFirestore, memoryLocalCache, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase (singleton pattern to prevent multiple instances)
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize Firestore with memory cache to avoid storage access errors
// This works in all browser contexts (normal, private, strict security)
let db: Firestore

try {
  // Try to initialize with memory cache (first time only)
  db = initializeFirestore(app, {
    localCache: memoryLocalCache()
  })
} catch (error: any) {
  // If already initialized, just get the existing instance
  if (error.code === 'failed-precondition' && error.message.includes('already been called')) {
    db = getFirestore(app)
  } else {
    throw error
  }
}

export { db }
export default app
