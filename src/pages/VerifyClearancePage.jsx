import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { MdCheckCircle, MdCancel, MdVerifiedUser } from 'react-icons/md'
import { FaGraduationCap } from 'react-icons/fa'

const EXIT_LABELS = {
  OLevelCompletion: 'O Level Graduate',
  ALevelCompletion: 'A Level Graduate',
  Transfer:         'Transfer Student',
}

export default function VerifyClearancePage() {
  const { clearanceSerial } = useParams()
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clearanceSerial) { setLoading(false); return }
    getDoc(doc(db, 'clearancePasses', clearanceSerial))
      .then(snap => {
        if (snap.exists() && snap.data().valid === true) {
          setResult({ valid: true, data: snap.data() })
        } else {
          setResult({ valid: false })
        }
      })
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false))
  }, [clearanceSerial])

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-[#C9A84C] rounded-full flex items-center justify-center shadow-lg">
          <FaGraduationCap className="text-[#0A1628] text-xl" />
        </div>
        <div>
          <p className="font-playfair font-bold text-white text-lg leading-tight">Oasis Private College</p>
          <p className="font-montserrat text-[#C9A84C] text-[10px] uppercase tracking-widest">Checheche, Zimbabwe</p>
        </div>
      </Link>

      {loading ? (
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      ) : result?.valid ? (
        <ValidCard data={result.data} />
      ) : (
        <InvalidCard serial={clearanceSerial} />
      )}
    </div>
  )
}

function ValidCard({ data }) {
  const issuedDate = data.issuedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) || '—'
  return (
    <div className="bg-[#0D1C35] border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full text-center">
      <MdCheckCircle className="text-emerald-400 text-6xl mx-auto mb-4" />
      <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-5">
        <MdVerifiedUser className="text-emerald-400 text-sm" />
        <span className="font-montserrat text-xs font-bold uppercase tracking-widest text-emerald-400">
          Valid Clearance Letter
        </span>
      </div>
      <div className="space-y-3 text-left mt-4">
        <Row label="Student Full Name"   value={data.studentName} />
        <Row label="Registration Number" value={<span className="font-mono font-bold">{data.regNo}</span>} />
        <Row label="Exit Type"           value={EXIT_LABELS[data.exitType] || data.exitType} />
        <Row label="Date Issued"         value={issuedDate} />
        <Row label="Issued By"           value={data.issuedBy} />
        <Row label="Clearance Serial"    value={<span className="font-mono text-[#C9A84C] text-xs">{data.clearanceSerial}</span>} />
      </div>
      <p className="font-montserrat text-xs text-emerald-300 leading-relaxed mt-6">
        This clearance letter was issued by Oasis Private College and is authentic.
      </p>
    </div>
  )
}

function InvalidCard({ serial }) {
  return (
    <div className="bg-[#0D1C35] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
      <MdCancel className="text-red-400 text-6xl mx-auto mb-4" />
      <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 mb-5">
        <span className="font-montserrat text-xs font-bold uppercase tracking-widest text-red-400">
          Invalid or Revoked
        </span>
      </div>
      <p className="font-montserrat text-sm text-gray-400 leading-relaxed mt-4">
        This document could not be verified. Please contact Oasis Private College administration.
      </p>
      {serial && (
        <p className="font-mono text-[10px] text-gray-600 mt-3">{serial}</p>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="font-montserrat text-[10px] uppercase tracking-wider text-gray-600">{label}</span>
      <span className="font-montserrat text-sm text-gray-200">{value || '—'}</span>
    </div>
  )
}
