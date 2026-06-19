import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

export async function getStoredLicense() {
  const snap = await getDoc(doc(db, 'licenseConfig', 'main'))
  return snap.exists() ? snap.data() : null
}

export async function saveStoredLicense({ token, secret }) {
  await setDoc(doc(db, 'licenseConfig', 'main'), {
    token:     token.trim(),
    secret:    secret.trim(),
    updatedAt: serverTimestamp(),
  })
}
