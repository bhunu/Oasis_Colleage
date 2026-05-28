import { db, storage } from './config'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const col = () => collection(db, 'gallery')

export const getGallery = async () =>
  (await getDocs(query(col(), orderBy('createdAt', 'desc')))).docs.map(d => ({ id: d.id, ...d.data() }))

export const uploadPhoto = async (file, category = 'general', caption = '') => {
  const path   = `gallery/${category}/${Date.now()}_${file.name}`
  const r      = ref(storage, path)
  await uploadBytes(r, file)
  const url    = await getDownloadURL(r)
  const docRef = await addDoc(col(), {
    url, path, category, caption, name: file.name, createdAt: serverTimestamp(),
  })
  return { id: docRef.id, url, path, category, caption, name: file.name }
}

export const updatePhoto = (id, data) =>
  updateDoc(doc(db, 'gallery', id), data)

export const deletePhoto = async (id, path) => {
  if (path) try { await deleteObject(ref(storage, path)) } catch {}
  return deleteDoc(doc(db, 'gallery', id))
}
