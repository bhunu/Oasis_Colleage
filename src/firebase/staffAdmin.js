import { db, storage } from './config'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const col = () => collection(db, 'staff')

export const getAdminStaff = async () => (await getDocs(query(col(), orderBy('createdAt', 'desc')))).docs.map(d => ({ id: d.id, ...d.data() }))

export const uploadStaffPhoto = async (file) => {
  const path = `staff/${Date.now()}_${file.name}`
  const r    = ref(storage, path)
  await uploadBytes(r, file)
  return { url: await getDownloadURL(r), path }
}

export const addAdminStaff    = (data) => addDoc(col(), { ...data, createdAt: serverTimestamp() })
export const updateAdminStaff = (id, data) => updateDoc(doc(db, 'staff', id), { ...data, updatedAt: serverTimestamp() })
export const deleteAdminStaff = async (id, photoPath) => {
  if (photoPath) try { await deleteObject(ref(storage, photoPath)) } catch {}
  return deleteDoc(doc(db, 'staff', id))
}
