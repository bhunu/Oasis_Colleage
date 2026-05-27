import { db, storage } from './config'
import { collection, addDoc, getDocs, doc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const col = () => collection(db, 'gallery')

export const getGallery = async () => (await getDocs(query(col(), orderBy('createdAt', 'desc')))).docs.map(d => ({ id: d.id, ...d.data() }))

export const uploadPhoto = async (file, album = 'General') => {
  const path = `gallery/${album}/${Date.now()}_${file.name}`
  const r    = ref(storage, path)
  await uploadBytes(r, file)
  const url  = await getDownloadURL(r)
  const ref_ = await addDoc(col(), { url, path, album, name: file.name, createdAt: serverTimestamp() })
  return { id: ref_.id, url, path, album, name: file.name }
}

export const deletePhoto = async (id, path) => {
  if (path) try { await deleteObject(ref(storage, path)) } catch {}
  return deleteDoc(doc(db, 'gallery', id))
}
