import { db, storage } from './config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const DOC = () => doc(db, 'content', 'homepage')

export const getHomepageContent = async () => {
  const snap = await getDoc(DOC())
  return snap.exists() ? snap.data() : {}
}

export const saveHomepageSection = async (section, data) => {
  await setDoc(DOC(), { [section]: data, updatedAt: serverTimestamp() }, { merge: true })
}

export const uploadContentImage = async (file, slot) => {
  const path = `content/homepage/${slot}_${Date.now()}_${file.name}`
  const r = ref(storage, path)
  await uploadBytes(r, file)
  const url = await getDownloadURL(r)
  return { url, path }
}

export const deleteContentImage = async (path) => {
  if (!path) return
  try { await deleteObject(ref(storage, path)) } catch {}
}
