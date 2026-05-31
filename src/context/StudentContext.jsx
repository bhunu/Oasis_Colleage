import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const StudentContext = createContext(null)
export const useStudent = () => useContext(StudentContext)

const DEFAULT_SETTINGS = {
  sessionTimeoutMinutes: 4,
  otpExpiryHours: 24,
  resultsAccessThreshold: 75,
  currentTerm: 'Term 2',
  currentYear: '2025',
}

export function StudentProvider({ children }) {
  const [studentData,     setStudentData]     = useState(null)
  const [portalSettings,  setPortalSettings]  = useState(DEFAULT_SETTINGS)
  const [authLoading,     setAuthLoading]     = useState(true)
  const [profileLoading,  setProfileLoading]  = useState(true)

  /* ── portalSettings — real-time via onSnapshot ── */
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'portalSettings', 'main'),
      snap => {
        if (snap.exists()) setPortalSettings({ ...DEFAULT_SETTINGS, ...snap.data() })
      },
      () => {}
    )
    return unsub
  }, [])

  /* ── Firebase Auth state change → fetch student data ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(false)
      if (!user) {
        setStudentData(null)
        setProfileLoading(false)
        return
      }

      try {
        /* 1. Read users/{uid} for auth-level data */
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        if (!userSnap.exists() || userSnap.data().role !== 'student') {
          /* signed-in user is NOT a student — force sign-out */
          await signOut(auth)
          setStudentData(null)
          setProfileLoading(false)
          return
        }
        const userData = userSnap.data()

        /* 2. Read students/{studentId} for profile data */
        const profileSnap = await getDoc(doc(db, 'students', userData.studentId))
        const profile = profileSnap.exists() ? profileSnap.data() : {}

        setStudentData({
          uid:              user.uid,
          studentId:        userData.studentId,
          hasSetupPassword: userData.hasSetupPassword ?? false,
          /* profile fields — handle both field-name variants */
          name:             profile.fullName || profile.name || '',
          class:            profile.class || '',
          dateOfBirth:      profile.dateOfBirth || '',
          guardianName:     profile.guardianName || profile.parentName || '',
          guardianPhone:    profile.guardianPhone || profile.parentPhone || '',
          guardianEmail:    profile.guardianEmail || profile.parentEmail || '',
          email:            profile.email || '',
          phone:            profile.phone || '',
          hasEmail:         profile.hasEmail ?? false,
          regNumber:        profile.reg_number || userData.studentId,
        })
      } catch {
        setStudentData(null)
      }
      setProfileLoading(false)
    })
    return unsub
  }, [])

  const loading = authLoading || profileLoading

  return (
    <StudentContext.Provider value={{ studentData, portalSettings, loading, authLoading }}>
      {children}
    </StudentContext.Provider>
  )
}
