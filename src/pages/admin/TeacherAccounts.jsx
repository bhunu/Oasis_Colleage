import { useState, useEffect } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  query, where, serverTimestamp, setDoc,
} from 'firebase/firestore'
import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut as authSignOut } from 'firebase/auth'
import { db } from '../../firebase/config'
import { MdAdd, MdDelete, MdEdit, MdClose, MdPeople, MdBook } from 'react-icons/md'
import toast from 'react-hot-toast'

const CARD    = 'bg-navy-800 border border-white/10 rounded-xl'
const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold/50 font-montserrat'
const labelCls = 'text-[10px] font-semibold uppercase tracking-wider text-gray-400 font-montserrat block mb-1'


export default function TeacherAccounts() {
  const [teachers,     setTeachers]     = useState([])
  const [assignments,  setAssignments]  = useState([])
  const [classes,      setClasses]      = useState([])
  const [subjects,     setSubjects]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showCreate,   setShowCreate]   = useState(false)
  const [showAssign,   setShowAssign]   = useState(null) // teacher uid
  const [creating,     setCreating]     = useState(false)
  const [assigning,    setAssigning]    = useState(false)

  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' })
  const [assignForm, setAssignForm] = useState({ className: '', subjects: [] })

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'users'), where('role', '==', 'teacher'))),
      getDocs(collection(db, 'teacherAssignments')),
      getDocs(collection(db, 'classes')),
      getDocs(collection(db, 'subjects')),
    ]).then(([tSnap, aSnap, cSnap, sSnap]) => {
      setTeachers(tSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setAssignments(aSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setClasses(cSnap.docs.map(d => d.data().name).filter(Boolean).sort())
      setSubjects(sSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const subjectsForClass = (className) =>
    subjects.filter(s => Array.isArray(s.classes) && s.classes.includes(className)).map(s => s.name)

  const teacherAssignments = (uid) => assignments.filter(a => a.uid === uid)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim() || !createForm.email.trim() || createForm.password.length < 6) {
      return toast.error('Name, email and a password of at least 6 characters are required.')
    }
    setCreating(true)

    // Always start with a fresh secondary app — kills any stale auth state from a previous failed attempt
    const stale = getApps().find(a => a.name === 'teacher-create')
    if (stale) await deleteApp(stale)
    const secondaryApp = initializeApp(getApp().options, 'teacher-create')

    try {
      const secondaryAuth = getAuth(secondaryApp)
      const cred = await createUserWithEmailAndPassword(secondaryAuth, createForm.email.trim(), createForm.password)
      await authSignOut(secondaryAuth)

      await setDoc(doc(db, 'users', cred.user.uid), {
        name:      createForm.name.trim(),
        email:     createForm.email.trim().toLowerCase(),
        role:      'teacher',
        active:    true,
        createdAt: serverTimestamp(),
      })

      const newTeacher = { id: cred.user.uid, name: createForm.name.trim(), email: createForm.email.trim(), role: 'teacher', active: true }
      setTeachers(prev => [...prev, newTeacher])
      setCreateForm({ name: '', email: '', password: '' })
      setShowCreate(false)
      toast.success(`Teacher account created for ${newTeacher.name}`)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists.')
      } else {
        toast.error('Failed to create account. Please try again.')
      }
    } finally {
      // Always tear down the secondary app — even on failure — so no ghost auth state lingers
      await deleteApp(secondaryApp).catch(() => {})
      setCreating(false)
    }
  }

  const handleDelete = async (uid, name) => {
    if (!window.confirm(`Remove teacher account for ${name}? This cannot be undone.`)) return
    try {
      await deleteDoc(doc(db, 'users', uid))
      // Remove all their assignments too
      const toDelete = assignments.filter(a => a.uid === uid)
      await Promise.all(toDelete.map(a => deleteDoc(doc(db, 'teacherAssignments', a.id))))
      setTeachers(prev => prev.filter(t => t.id !== uid))
      setAssignments(prev => prev.filter(a => a.uid !== uid))
      toast.success('Teacher account removed')
    } catch { toast.error('Failed to remove account') }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assignForm.className || assignForm.subjects.length === 0) {
      return toast.error('Select a class and at least one subject.')
    }
    setAssigning(true)
    try {
      const teacher = teachers.find(t => t.id === showAssign)
      const ref = await addDoc(collection(db, 'teacherAssignments'), {
        uid:          showAssign,
        email:        teacher?.email ?? '',
        displayName:  teacher?.name  ?? '',
        className:    assignForm.className,
        subjects:     assignForm.subjects,
        assignedAt:   serverTimestamp(),
      })
      setAssignments(prev => [...prev, { id: ref.id, uid: showAssign, className: assignForm.className, subjects: assignForm.subjects }])
      setAssignForm({ className: '', subjects: [] })
      toast.success('Assignment added')
    } catch { toast.error('Failed to assign') }
    finally { setAssigning(false) }
  }

  const removeAssignment = async (id) => {
    try {
      await deleteDoc(doc(db, 'teacherAssignments', id))
      setAssignments(prev => prev.filter(a => a.id !== id))
      toast.success('Assignment removed')
    } catch { toast.error('Failed to remove') }
  }

  const toggleSubject = (name) => {
    setAssignForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(name)
        ? prev.subjects.filter(s => s !== name)
        : [...prev.subjects, name],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Teacher Accounts</h1>
          <p className="text-gray-400 font-montserrat text-sm mt-1">Create teacher logins and assign classes &amp; subjects.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-montserrat font-bold text-sm px-4 py-2.5 rounded-xl transition"
        >
          <MdAdd className="text-lg" />
          Add Teacher
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-playfair text-lg font-bold text-white">Create Teacher Account</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><MdClose className="text-xl" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input className={inputCls} placeholder="e.g. Mr. Tafara Maphosa" value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" className={inputCls} placeholder="teacher@oasis.ac.zw" value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Initial Password</label>
                <input type="password" className={inputCls} placeholder="Minimum 6 characters" value={createForm.password}
                  onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 font-montserrat text-sm hover:bg-white/5 transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-gold text-navy font-montserrat font-bold text-sm disabled:opacity-50 transition">
                  {creating ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teachers list */}
      {teachers.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <MdPeople className="text-4xl text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 font-montserrat text-sm">No teacher accounts yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teachers.map(teacher => {
            const myAssignments = teacherAssignments(teacher.id)
            return (
              <div key={teacher.id} className={`${CARD} p-5`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-white font-semibold font-montserrat">{teacher.name}</p>
                    <p className="text-gray-500 font-montserrat text-xs mt-0.5">{teacher.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setShowAssign(teacher.id); setAssignForm({ className: '', subjects: [] }) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-montserrat font-semibold hover:bg-violet-500/20 transition"
                    >
                      <MdBook className="text-sm" /> Assign
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id, teacher.name)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                    >
                      <MdDelete className="text-lg" />
                    </button>
                  </div>
                </div>

                {/* Assignments */}
                {myAssignments.length === 0 ? (
                  <p className="text-xs text-gray-600 font-montserrat">No class assignments yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {myAssignments.map(a => (
                      <div key={a.id} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-white font-montserrat font-semibold">{a.className}</span>
                        <span className="text-xs text-gray-500 font-montserrat">— {(a.subjects || []).join(', ')}</span>
                        <button onClick={() => removeAssignment(a.id)} className="text-red-400 hover:text-red-300 ml-1"><MdClose className="text-sm" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Assign modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-playfair text-lg font-bold text-white">Assign Class &amp; Subjects</h2>
              <button onClick={() => setShowAssign(null)} className="text-gray-400 hover:text-white"><MdClose className="text-xl" /></button>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className={labelCls}>Class</label>
                <select className={inputCls} value={assignForm.className}
                  onChange={e => setAssignForm(p => ({ ...p, className: e.target.value, subjects: [] }))}>
                  <option value="">Select class…</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {assignForm.className && (
                <div>
                  <label className={labelCls}>Subjects (select all that apply)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {subjectsForClass(assignForm.className).map(s => (
                      <button key={s} type="button"
                        onClick={() => toggleSubject(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold border transition ${
                          assignForm.subjects.includes(s)
                            ? 'bg-gold/20 border-gold/50 text-gold'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}>
                        {s}
                      </button>
                    ))}
                    {subjectsForClass(assignForm.className).length === 0 && (
                      <p className="text-xs text-gray-500 font-montserrat">No subjects configured for this class. Add them in Subjects management.</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAssign(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 font-montserrat text-sm hover:bg-white/5 transition">
                  Cancel
                </button>
                <button type="submit" disabled={assigning}
                  className="flex-1 py-2.5 rounded-xl bg-gold text-navy font-montserrat font-bold text-sm disabled:opacity-50 transition">
                  {assigning ? 'Saving…' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
