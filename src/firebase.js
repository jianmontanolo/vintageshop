// ============================================================
// FIREBASE CONFIGURATION — filled in from Firebase Console
// ============================================================
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDjasxLohIYPd9R6GSnz_GXvVvxR4y-ZXI",
  authDomain: "top-inventory-a9e6c.firebaseapp.com",
  projectId: "top-inventory-a9e6c",
  storageBucket: "top-inventory-a9e6c.firebasestorage.app",
  messagingSenderId: "794802309089",
  appId: "1:794802309089:web:c0d26592b96679caf034a0",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
