import { useState } from 'react'
import StudentAccessPass from '../components/StudentAccessPass'
import { MdBadge, MdSearch } from 'react-icons/md'

export default function AccessPassPage() {
  const [input, setInput] = useState('')
  const [regNo, setRegNo] = useState(null)
  const [key, setKey]     = useState(0)

  const handleGenerate = () => {
    const v = input.trim().toUpperCase()
    if (!v) return
    setRegNo(v)
    setKey(k => k + 1)   // remount pass component on new search
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gold/15 rounded-lg flex items-center justify-center shrink-0">
          <MdBadge className="text-gold" />
        </div>
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Student Facility Access Pass</h1>
          <p className="font-montserrat text-xs text-gray-500 mt-0.5">
            Generate a fee-verified, secure access pass for a student
          </p>
        </div>
      </div>

      {/* Info strip */}
      <div className="bg-gold/8 border border-gold/25 rounded-xl px-5 py-3">
        <p className="font-montserrat text-[11px] text-gray-400 leading-relaxed">
          The pass is only printable when the student has paid at least{' '}
          <span className="text-gold font-semibold">75%</span> of current term fees.
          A unique serial number is saved to the database before printing.
        </p>
      </div>

      {/* Search card */}
      <div className="bg-navy-800 border border-white/10 rounded-2xl p-6">
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1.5">
          Student Registration Number
        </label>
        <p className="text-[10px] text-gray-600 font-montserrat mb-2">
          Enter the student's <span className="text-gray-400 font-semibold">reg number</span> — format: R&#123;YY&#125;&#123;NNNN&#125; e.g. R260001. Not the student ID (OC-…).
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. R260001"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className="flex-1 bg-white/5 border border-white/10 focus:border-gold/50 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm placeholder-gray-600 transition-all uppercase"
          />

          <button
            onClick={handleGenerate}
            disabled={!input.trim()}
            className="flex items-center gap-2 bg-gold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy font-montserrat text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all"
          >
            <MdSearch className="text-base" />
            Generate Pass
          </button>
        </div>
      </div>

      {/* Pass preview */}
      {regNo && <StudentAccessPass key={key} regNo={regNo} />}

    </div>
  )
}
