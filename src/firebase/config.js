import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Replace these values with your Firebase project config
// from: https://console.firebase.google.com → Project Settings → Your apps
const firebaseConfig = {
  apiKey:            "AIzaSyD0XU3EbtEvTBnQW88-DJfDR9pDGF7wNJU",
  authDomain:        "oasis-818f2.firebaseapp.com",
  projectId:         "oasis-818f2",
  storageBucket:     "oasis-818f2.firebasestorage.app",
  messagingSenderId: "511056970675",
  appId:             "1:511056970675:web:314d38c980c99335d901c6",
}

const app = initializeApp(firebaseConfig)

export const db      = getFirestore(app)
export const auth    = getAuth(app)
export const storage = getStorage(app)
export default app
