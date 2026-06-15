import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/config'
import { updateProfile } from 'firebase/auth'
import toast from 'react-hot-toast'
import { MdSave as IconSave, MdPerson as IconPerson, MdSchool as IconSchool, MdCalendarMonth as IconCalendar } from 'react-icons/md'

export default function Settings() {
  const [user] = useAuthState(auth)
  const [schoolConfig, setSchoolConfig] = useState({
    schoolName: 'Oasis Private College',
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
        }),
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* School Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <IconSchool size={20} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">School Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input
                type="text"
                value={schoolConfig.schoolName}
                onChange={e => setSchoolConfig(p => ({ ...p, schoolName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={schoolConfig.schoolAddress}
                onChange={e => setSchoolConfig(p => ({ ...p, schoolAddress: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Term</label>
              <select
                value={schoolConfig.currentTerm}
                onChange={e => setSchoolConfig(p => ({ ...p, currentTerm: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="number"
                value={schoolConfig.currentYear}
                onChange={e => setSchoolConfig(p => ({ ...p, currentYear: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term Start Date</label>
              <input
                type="date"
                value={schoolConfig.termStartDate}
                onChange={e => setSchoolConfig(p => ({ ...p, termStartDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term End Date</label>
              <input
                type="date"
                value={schoolConfig.termEndDate}
                onChange={e => setSchoolConfig(p => ({ ...p, termEndDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

        </div>

        <div className="mt-5">
          <button
            onClick={handleSaveSchool}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            <IconSave size={16} />
            {saving ? 'Saving…' : 'Save School Settings'}
          </button>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <IconPerson size={20} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">Admin Profile</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (read-only)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
            />
          </div>
        </div>

        <div className="mt-5">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            <IconSave size={16} />
            {savingProfile ? 'Saving…' : 'Update Profile'}
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>System</span>
            <span className="font-medium text-gray-900">Oasis Student Records Admin</span>
          </div>
          <div className="flex justify-between">
            <span>Database</span>
            <span className="font-medium text-gray-900">Firebase Firestore</span>
          </div>
          <div className="flex justify-between">
            <span>Project</span>
            <span className="font-medium text-gray-900">oasis-818f2</span>
          </div>
          <div className="flex justify-between">
            <span>Logged in as</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
