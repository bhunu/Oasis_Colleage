import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, query, collection, where, limit } from 'firebase/firestore'
import { db } from '../firebase/config'

const StudentContext = createContext(null)
export const useStudent = () => useContext(StudentContext)

const DEFAULT_SETTINGS = {
  sessionTimeoutMinutes: 20,
  otpExpiryHours: 24,
  resultsAccessThreshold: 75,
  currentTerm: 'Term 2',
  currentYear: '2025',
}

// Clamp numeric fields to safe ranges so a typo in Firestore cannot break
// session management (timeout ≤ 0 → instant logout) or lock all students out
// of results (threshold > 100 → impossible to reach).
function sanitiseSettings(raw) {
  const n = (v, fallback) => { const x = Number(v); return isNaN(x) ? fallback : x }
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    sessionTimeoutMinutes:  Math.max(1,   Math.min(120, n(raw.sessionTimeoutMinutes,  DEFAULT_SETTINGS.sessionTimeoutMinutes))),
    otpExpiryHours:         Math.max(1,   Math.min(168, n(raw.otpExpiryHours,         DEFAULT_SETTINGS.otpExpiryHours))),
    resultsAccessThreshold: Math.max(0,   Math.min(100, n(raw.resultsAccessThreshold, DEFAULT_SETTINGS.resultsAccessThreshold))),
  }
}

export function StudentProvider({ children }) {
  const [studentData,      setStudentData]      = useState(null)
  const [portalSettings,   setPortalSettings]   = useState(DEFAULT_SETTINGS)
  const [loading,          setLoading]          = useState(true)
  const [isBoarder,        setIsBoarder]        = useState(false)
  const [firestoreStudent, setFirestoreStudent] = useState(null)

  /* portalSettings — real-time */
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'portalSettings', 'main'),
      snap => { if (snap.exists()) setPortalSettings(sanitiseSettings(snap.data())) },
      () => {}
    )
    return unsub
  }, [])

  /* Session-based student auth */
  useEffect(() => {
    const raw = sessionStorage.getItem('studentSession')
    if (!raw) { setLoading(false); return }
    try {
      const session = JSON.parse(raw)
      if (session?.uid && session?.studentId) setStudentData(session)
    } catch {}
    setLoading(false)
  }, [])

  /* Real-time student Firestore document — exposes exitType, status, cancelTransferEnabled, etc. */
  useEffect(() => {
    if (!studentData?.regNumber) { setIsBoarder(false); setFirestoreStudent(null); return }
    const q = query(collection(db, 'students'), where('reg_number', '==', studentData.regNumber), limit(1))
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) {
        const data = snap.docs[0].data()
        setIsBoarder(data.boardingStatus === 'boarder')
        setFirestoreStudent({ id: snap.docs[0].id, ...data })
      } else {
        setFirestoreStudent(null)
      }
    }, () => setIsBoarder(false))
    return unsub
  }, [studentData?.regNumber])

  const logout = useCallback(() => {
    sessionStorage.removeItem('studentSession')
    setStudentData(null)
    setIsBoarder(false)
    setFirestoreStudent(null)
  }, [])

  return (
    <StudentContext.Provider value={{ studentData, portalSettings, loading, authLoading: false, logout, isBoarder, firestoreStudent }}>
      {children}
    </StudentContext.Provider>
  )
}
