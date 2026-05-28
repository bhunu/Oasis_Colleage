import { db, storage } from './config'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const col = () => collection(db, 'news')

export const getNews    = async () => (await getDocs(query(col(), orderBy('createdAt', 'desc')))).docs.map(d => ({ id: d.id, ...d.data() }))
export const addNews    = (data) => addDoc(col(), { ...data, createdAt: serverTimestamp() })
export const updateNews = (id, data) => updateDoc(doc(db, 'news', id), { ...data, updatedAt: serverTimestamp() })

export const uploadNewsImage = async (file) => {
  const path = `news/${Date.now()}_${file.name}`
  const r = ref(storage, path)
  await uploadBytes(r, file)
  return { url: await getDownloadURL(r), path }
}

export const deleteNews = async (id, imagePath) => {
  if (imagePath) try { await deleteObject(ref(storage, imagePath)) } catch {}
  return deleteDoc(doc(db, 'news', id))
}
