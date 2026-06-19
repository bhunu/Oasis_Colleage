import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/config'
import { updateProfile } from 'firebase/auth'
import toast from 'react-hot-toast'
import { MdSave as IconSave, MdPerson as IconPerson, MdSchool as IconSchool, MdPalette as IconPalette, MdLightMode, MdDarkMode } from 'react-icons/md'
import { useTheme } from '../context/ThemeContext'
import sc from '../utils/schoolConfig'

const inputCls = 'w-full border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-gold/50 transition'

export default function Settings() {
  const [user] = useAuthState(auth)
  const { dark, toggle } = useTheme()
  const [schoolConfig, setSchoolConfig] = useState({
    schoolName: sc.name,
    schoolAddress: 'Chechecha, Zimbabwe',
    currentTerm: '2',
    currentYear: '2025',
    termStartDate: '',
    termEndDate: '',
  })
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [schoolSnap, portalSnap] = await Promise.all([
          getDoc(doc(db, 'config', 'schoolSettings')),
          getDoc(doc(db, 'portalSettings', 'main')),
        ])
        const merged = {}
        if (schoolSnap.exists()) Object.assign(merged, schoolSnap.data())
        if (portalSnap.exists()) {
          const { currentTerm, currentYear } = portalSnap.data()
          if (currentTerm) merged.currentTerm = currentTerm
          if (currentYear) merged.currentYear = currentYear
        }
        setSchoolConfig(prev => ({ ...prev, ...merged }))
      } catch {
        // defaults ok
      } finally {
        setLoading(false)
      }
    }
    load()
    if (user?.displayName) setDisplayName(user.displayName)
  }, [user])

  const handleSaveSchool = async () => {
    setSaving(true)
    try {
      await Promise.all([
        setDoc(doc(db, 'config', 'schoolSettings'), {
          schoolName:    schoolConfig.schoolName,
          schoolAddress: schoolConfig.schoolAddress,
          termStartDate: schoolConfig.termStartDate,
          termEndDate:   schoolConfig.termEndDate,
          updatedAt:  serverTimestamp(),
          updatedBy:  user?.email,
        }, { merge: true }),
        setDoc(doc(db, 'portalSettings', 'main'), {
          currentTerm: schoolConfig.currentTerm,
          currentYear: schoolConfig.currentYear,
          updatedAt:  serverTimestamp(),
          updatedBy:  user?.email,
        }, { merge: true }),
      ])
      toast.success('School settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return
    setSavingProfile(true)
    try {
      await updateProfile(user, { displayName: displayName.trim() })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* School Settings */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <div className="flex items-center gap-2 mb-5">
          <IconSchool size={20} className="text-blue-600 dark:text-gold" />
          <h3 className="font-semibold text-gray-900 dark:text-white font-playfair">School Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-montserrat">School Name</label>
              <input
                type="text"
                value={schoolConfig.schoolName}
                onChange={e => setSchoolConfig(p => ({ ...p, schoolName: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-montserrat">Address</label>
              <input
                type="text"
                value={schoolConfig.schoolAddress}
                onChange={e => setSchoolConfig(p => ({ ...p, schoolAddress: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-montserrat">Current Term</label>
              <select
                value={schoolConfig.currentTerm}
                onChange={e => setSchoolConfig(p => ({ ...p, currentTerm: e.target.value }))}
                className={inputCls}
              >
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-montserrat">Academic Year</label>
              <input
                type="number"
                value={schoolConfig.currentYear}
                onChange={e => setSchoolConfig(p => ({ ...p, currentYear: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-montserrat">Term Start Date</label>
              <input
                type="date"
                value={schoolConfig.termStartDate}
                onChange={e => setSchoolConfig(p => ({ ...p, termStartDate: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-montserrat">Term End Date</label>
              <input
                type="date"
                value={schoolConfig.termEndDate}
                onChange={e => setSchoolConfig(p => ({ ...p, termEndDate: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={handleSaveSchool}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 dark:bg-gold text-white dark:text-navy px-5 py-2 rounded-lg text-sm font-semibold font-montserrat hover:bg-blue-700 dark:hover:bg-gold/90 transition disabled:opacity-50"
          >
            <IconSave size={16} />
            {saving ? 'Saving…' : 'Save School Settings'}
          </button>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <div className="flex items-center gap-2 mb-5">
          <IconPerson size={20} className="text-blue-600 dark:text-gold" />
          <h3 className="font-semibold text-gray-900 dark:text-white font-playfair">Admin Profile</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-montserrat">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-montserrat">Email (read-only)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-200 dark:border-white/5 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-600 font-montserrat"
            />
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 bg-blue-600 dark:bg-gold text-white dark:text-navy px-5 py-2 rounded-lg text-sm font-semibold font-montserrat hover:bg-blue-700 dark:hover:bg-gold/90 transition disabled:opacity-50"
          >
            <IconSave size={16} />
            {savingProfile ? 'Saving…' : 'Update Profile'}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <div className="flex items-center gap-2 mb-3">
          <IconPalette size={20} className="text-blue-600 dark:text-gold" />
          <h3 className="font-semibold text-gray-900 dark:text-white font-playfair">Appearance</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-montserrat mb-4">
          Choose how the system looks. This preference is saved in your browser.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => !dark && toggle()}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              !dark
                ? 'border-blue-600 bg-blue-50 dark:border-gold dark:bg-gold/10'
                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white border border-gray-300 dark:border-white/20 flex items-center justify-center shadow-sm">
              <MdLightMode size={22} className="text-amber-500" />
            </div>
            <span className={`text-sm font-semibold font-montserrat ${!dark ? 'text-blue-700 dark:text-gold' : 'text-gray-700 dark:text-gray-400'}`}>Light</span>
            {!dark && <span className="text-[10px] text-blue-500 dark:text-gold font-montserrat uppercase tracking-wide">Active</span>}
          </button>
          <button
            onClick={() => dark && toggle()}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              dark
                ? 'border-blue-600 dark:border-gold bg-blue-50 dark:bg-gold/10'
                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50 dark:bg-white/5'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-navy-800 border border-white/20 flex items-center justify-center shadow-sm">
              <MdDarkMode size={22} className="text-gold" />
            </div>
            <span className={`text-sm font-semibold font-montserrat ${dark ? 'text-blue-700 dark:text-gold' : 'text-gray-700 dark:text-gray-400'}`}>Dark</span>
            {dark && <span className="text-[10px] text-blue-500 dark:text-gold font-montserrat uppercase tracking-wide">Active</span>}
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white font-playfair mb-4">System Information</h3>
        <div className="space-y-2.5 text-sm font-montserrat">
          {[
            ['System',      'Oasis Student Records Admin'],
            ['Database',    'Firebase Firestore'],
            ['Project',     'oasis-818f2'],
            ['Logged in as', user?.email],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-500">{label}</span>
              <span className="font-medium text-gray-900 dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
