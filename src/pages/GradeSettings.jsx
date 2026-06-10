import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import toast from 'react-hot-toast'
import { MdSave, MdSchool } from 'react-icons/md'

const DEFAULT_O = [
  { grade: 'A', min: 75, max: 100 },
  { grade: 'B', min: 65, max: 74 },
  { grade: 'C', min: 50, max: 64 },
  { grade: 'D', min: 40, max: 49 },
  { grade: 'U', min: 0,  max: 39  },
]

const DEFAULT_A = [
  { grade: 'A', min: 80, max: 100, points: 5 },
  { grade: 'B', min: 70, max: 79,  points: 4 },
  { grade: 'C', min: 60, max: 69,  points: 3 },
  { grade: 'D', min: 50, max: 59,  points: 2 },
  { grade: 'U', min: 0,  max: 49,  points: 0 },
]

function gradeChip(grade) {
  const g = grade.toUpperCase()
  if (g.startsWith('A')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  if (g.startsWith('B')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  if (g.startsWith('C')) return 'bg-yellow-500/15 text-[#C9A84C] border-yellow-500/30'
  if (g.startsWith('D')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
  return 'bg-red-500/15 text-red-400 border-red-500/30'
}

function NumCell({ value, onChange }) {
  return (
    <input
      type="number"
      min={0}
      max={100}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-16 bg-white/5 border border-white/15 rounded-lg px-2 py-1.5 text-sm text-white font-montserrat text-center focus:outline-none focus:border-[#C9A84C]/60 focus:ring-1 focus:ring-[#C9A84C]/30 transition"
    />
  )
}

export default function GradeSettings() {
  const [tab,     setTab]     = useState('o')
  const [oGrades, setOGrades] = useState(DEFAULT_O)
  const [aGrades, setAGrades] = useState(DEFAULT_A)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'config', 'gradeSettings'))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data()
          if (d.oLevel?.length) setOGrades(d.oLevel)
          if (d.aLevel?.length) setAGrades(d.aLevel)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateO = (idx, field, val) => setOGrades(g => g.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  const updateA = (idx, field, val) => setAGrades(g => g.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const save = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'config', 'gradeSettings'), { oLevel: oGrades, aLevel: aGrades })
      toast.success('Grade settings saved')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save grade settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-playfair text-2xl font-bold text-white">Grade Settings</h1>
        <p className="text-gray-400 font-montserrat text-sm mt-1">
          Configure mark ranges and grade points used in the student results portal.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        {[
          { key: 'o', label: 'O Level (Forms 1–4)' },
          { key: 'a', label: 'A Level (Lower / Upper 6)' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold font-montserrat transition ${
              tab === t.key
                ? 'bg-[#C9A84C] text-[#0A1628]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* O Level table */}
      {tab === 'o' && (
        <div className="bg-[#0D1C35] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
            <MdSchool className="text-[#C9A84C]" />
            <span className="font-playfair font-semibold text-white">O Level Grade Ranges</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Grade', 'Min %', 'Max %'].map(h => (
                  <th key={h} className="py-3 px-5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {oGrades.map((row, idx) => (
                <tr key={row.grade} className="border-b border-white/5 last:border-0">
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border font-montserrat ${gradeChip(row.grade)}`}>
                      {row.grade}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <NumCell value={row.min} onChange={v => updateO(idx, 'min', v)} />
                  </td>
                  <td className="py-3 px-5">
                    <NumCell value={row.max} onChange={v => updateO(idx, 'max', v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* A Level table */}
      {tab === 'a' && (
        <div className="bg-[#0D1C35] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
            <MdSchool className="text-[#C9A84C]" />
            <span className="font-playfair font-semibold text-white">A Level Grade Ranges & Points</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Grade', 'Min %', 'Max %', 'Points'].map(h => (
                  <th key={h} className="py-3 px-5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aGrades.map((row, idx) => (
                <tr key={row.grade} className="border-b border-white/5 last:border-0">
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border font-montserrat ${gradeChip(row.grade)}`}>
                      {row.grade}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <NumCell value={row.min} onChange={v => updateA(idx, 'min', v)} />
                  </td>
                  <td className="py-3 px-5">
                    <NumCell value={row.max} onChange={v => updateA(idx, 'max', v)} />
                  </td>
                  <td className="py-3 px-5">
                    <NumCell value={row.points} onChange={v => updateA(idx, 'points', v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 disabled:opacity-60 text-[#0A1628] font-montserrat font-bold text-sm px-6 py-3 rounded-xl transition"
      >
        <MdSave className="text-lg" />
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
