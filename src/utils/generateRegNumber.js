import { getDocs, query, collection, where } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function generateRegNumber() {
  const year = String(new Date().getFullYear()).slice(-2)

  for (let attempt = 0; attempt < 20; attempt++) {
    const digits = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
    const regNumber = `R${year}${digits}`
    const snap = await getDocs(query(collection(db, 'students'), where('reg_number', '==', regNumber)))
    if (snap.empty) return regNumber
  }

  // Fallback: use last 3 digits of current timestamp to guarantee uniqueness
  return `R${year}${String(Date.now()).slice(-3)}`
}
