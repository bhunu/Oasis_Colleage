import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './config'

export async function getThemeConfig() {
  try {
    const snap = await getDoc(doc(db, 'themeConfig', 'main'))
    return snap.exists() ? snap.data() : null
  } catch {
    return null
  }
}

export async function saveThemeConfig(data) {
  await setDoc(doc(db, 'themeConfig', 'main'), data, { merge: true })
}

export async function getPresets() {
  try {
    const snap = await getDoc(doc(db, 'themeConfig', 'main'))
    return snap.exists() ? (snap.data().presets ?? null) : null
  } catch {
    return null
  }
}

export async function savePresets(presets) {
  await setDoc(doc(db, 'themeConfig', 'main'), { presets }, { merge: true })
}
