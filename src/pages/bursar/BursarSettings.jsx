import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase/config'
import { doc, getDoc, setDoc, getDocs, collection, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { MdLock, MdSave } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

const TEAL  = '#0F6E56'
const INPUT = 'w-full bg-white/5 border border-white/10 focus:border-[#0F6E56]/50 focus:outline-none rounded-xl px-4 py-3 text-white font-montserrat text-sm placeholder-gray-600 transition-all'
const LABEL = 'block text-[10px] font-semibold uppercase tracking-widest text-gray-500 font-montserrat mb-1.5'
const CARD  = 'bg-[#0D1C35] border border-white/10 rounded-xl p-6'

function getBursarSession() {
  try { return JSON.parse(sessionStorage.getItem('bursarSession') || '{}') } catch { return {} }
}

function fmtTs(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function BursarSettings() {
  const navigate = useNavigate()
  const session  = getBursarSession()

  const [term,       setTerm]       = useState('Term 2')
  const [year,       setYear]       = useState('2025')
  const [currency,   setCurrency]   = useState('USD')
  const [termFees,   setTermFees]   = useState('')
  const [sysSaving,  setSysSaving]  = useState(false)
  const [sysLoaded,  setSysLoaded]  = useState(false)

  const [applying,     setApplying]     = useState(false)

  const applyFeesToAllAccounts = async () => {
    const fees = parseFloat(termFees)
    if (!fees || fees <= 0) return toast.error('Set a valid term fee amount first.')
    if (!confirm(`Apply $${fees.toFixed(2)} term fees to ALL student accounts? This will overwrite existing term fee values.`)) return
    setApplying(true)
    try {
      const snap = await getDocs(collection(db, 'feeAccounts'))
      const batch = writeBatch(db)
      snap.docs.forEach(d => {
        const data   = d.data()
        const paid   = data.totalPaid || 0
        const balance = Math.max(0, fees - paid)
        const balanceType = paid >= fees ? (paid > fees ? 'credit' : 'nil') : 'debit'
        batch.update(d.ref, { termFees: fees, balance, balanceType })
      })
      await batch.commit()
      toast.success(`Term fees of $${fees.toFixed(2)} applied to ${snap.size} accounts.`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to apply fees to accounts.')
    }
    setApplying(false)
  }

  // Results access gate
  const [threshold,    setThreshold]    = useState(75)
  const [gateSaving,   setGateSaving]   = useState(false)
  const [gateMeta,     setGateMeta]     = useState({ updatedAt: null, updatedBy: null })
  const [gateLoaded,   setGateLoaded]   = useState(false)

  useEffect(() => {
    // Load system settings (term fees, term, year, currency)
    getDoc(doc(db, 'settings', 'portalConfig'))
      .then(s => {
        if (s.exists()) {
          const d = s.data()
          if (d.currentTerm)  setTerm(d.currentTerm)
          if (d.currentYear)  setYear(d.currentYear)
          if (d.currency)     setCurrency(d.currency)
          if (d.termFees != null) setTermFees(String(d.termFees))
        }
      })
      .catch(() => {})
      .finally(() => setSysLoaded(true))

    // Load results gate threshold
    getDoc(doc(db, 'portalSettings', 'main'))
      .then(s => {
        if (s.exists()) {
          const data = s.data()
          if (data.resultsAccessThreshold != null) setThreshold(data.resultsAccessThreshold)
          setGateMeta({ updatedAt: data.updatedAt ?? null, updatedBy: data.updatedBy ?? null })
        }
      })
      .catch(() => {})
      .finally(() => setGateLoaded(true))
  }, [])

  const saveThreshold = async () => {
    setGateSaving(true)
    try {
      const name = session.name || 'Bursar'
      await setDoc(doc(db, 'portalSettings', 'main'), {
        resultsAccessThreshold: Number(threshold),
        updatedAt: serverTimestamp(),
        updatedBy: name,
      }, { merge: true })
      setGateMeta({ updatedAt: new Date(), updatedBy: name })
      toast.success('Results gate threshold saved')
    } catch {
      toast.error('Failed to save')
    }
    setGateSaving(false)
  }

  const exampleFees     = parseFloat(termFees) || 0
  const thresholdAmount = Math.round((threshold / 100) * exampleFees)

  const handleSave = async () => {
    const fees = parseFloat(termFees)
    if (termFees !== '' && (isNaN(fees) || fees < 0)) {
      return toast.error('Term fees must be a valid positive number.')
    }
    setSysSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'portalConfig'), {
        currentTerm: term,
        currentYear: year,
        currency,
        ...(termFees !== '' && { termFees: fees }),
        updatedAt:   serverTimestamp(),
        updatedBy:   session.name || 'Bursar',
      }, { merge: true })
      toast.success('Settings saved successfully.')
    } catch {
      toast.error('Failed to save settings.')
    }
    setSysSaving(false)
  }

  const handleLogout = async () => {
    sessionStorage.removeItem('bursarSession')
    await signOut(auth).catch(() => {})
    navigate('/')
  }

  const initials = session.name
    ? session.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SB'

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Profile card */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-5">Your Profile</h3>
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl font-montserrat"
            style={{ backgroundColor: TEAL }}>
            {initials}
          </div>
          <div>
            <p className="text-white font-semibold font-montserrat">{session.name || 'School Bursar'}</p>
            <p className="text-sm text-gray-400 font-montserrat">{session.email || '—'}</p>
            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-montserrat" style={{ backgroundColor: `${TEAL}22`, color: TEAL }}>
              Bursar
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 font-montserrat">
          To update your profile or change your password, contact the system administrator.
        </p>
      </div>

      {/* System settings */}
      <div className={CARD}>
        <h3 className="font-playfair font-semibold text-white mb-5">System Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Current Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)} className={INPUT}>
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Academic Year</label>
            <select value={year} onChange={e => setYear(e.target.value)} className={INPUT}>
              <option>2025</option>
              <option>2024</option>
              <option>2023</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={INPUT}>
              <option value="USD">USD ($)</option>
              <option value="ZWL">ZWL (Z$)</option>
              <option value="ZAR">ZAR (R)</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>School Name</label>
            <input value="Oasis Private College" readOnly className={`${INPUT} opacity-50 cursor-not-allowed`} />
          </div>
          <div className="col-span-2">
            <label className={LABEL}>Term Fees ({currency === 'USD' ? '$' : currency === 'ZWL' ? 'Z$' : 'R'})</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={termFees}
              onChange={e => setTermFees(e.target.value)}
              placeholder="e.g. 800.00"
              disabled={!sysLoaded}
              className={`${INPUT} disabled:opacity-50`}
            />
            <p className="text-[10px] text-gray-600 font-montserrat mt-1.5">
              The standard fee amount charged per student for {term} {year}. Used for fee balance calculations.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={sysSaving || !sysLoaded}
            className="px-6 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition disabled:opacity-60 flex items-center gap-2"
            style={{ backgroundColor: TEAL }}
          >
            <MdSave className="text-base" />
            {sysSaving ? 'Saving…' : 'Save Settings'}
          </button>

          <button
            onClick={applyFeesToAllAccounts}
            disabled={applying || !termFees || parseFloat(termFees) <= 0}
            className="px-6 py-3 rounded-xl text-sm font-semibold font-montserrat text-white transition disabled:opacity-60 flex items-center gap-2 bg-amber-600 hover:bg-amber-500"
          >
            {applying ? 'Applying…' : 'Apply fees to all accounts'}
          </button>
        </div>
        {termFees && parseFloat(termFees) > 0 && (
          <p className="text-[10px] text-gray-600 font-montserrat mt-3">
            "Apply fees to all accounts" will set{' '}
            <span className="text-amber-400 font-semibold">
              {currency === 'USD' ? '$' : currency === 'ZWL' ? 'Z$' : 'R'}{parseFloat(termFees).toFixed(2)}
            </span>{' '}
            as the term fee on every student fee account and recalculate balances.
          </p>
        )}
      </div>

      {/* Results Access Gate */}
      <div className={CARD}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${TEAL}22` }}>
            <MdLock style={{ color: TEAL }} className="text-lg" />
          </div>
          <h3 className="font-playfair font-semibold text-white text-lg">Results Access Gate</h3>
        </div>

        <label className="block text-sm text-white font-montserrat font-semibold mb-0.5">
          Minimum fee payment threshold
        </label>
        <p className="text-xs text-gray-500 font-montserrat mb-3">
          Students must pay at least this percentage of their term fees to be able to view their academic results.
        </p>

        <div className="flex items-center gap-3">
          <input
            type="number" min={0} max={100}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            disabled={!gateLoaded}
            className="w-28 bg-white/5 border border-white/10 focus:border-[#0F6E56]/50 focus:outline-none rounded-xl px-4 py-2.5 text-white font-montserrat text-sm text-right disabled:opacity-50"
          />
          <span className="text-gray-400 font-montserrat text-sm">%</span>
          <button
            onClick={saveThreshold}
            disabled={gateSaving || !gateLoaded}
            className="ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-white transition disabled:opacity-50"
            style={{ backgroundColor: TEAL }}
          >
            <MdSave className="text-base" />
            {gateSaving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Live preview */}
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest font-montserrat mb-1" style={{ color: `${TEAL}99` }}>
            Live Preview
          </p>
          <p className="text-sm font-montserrat text-gray-400 leading-relaxed">
            A student with <span className="text-white font-semibold">${exampleFees}</span> in fees must pay at least{' '}
            <span className="font-bold" style={{ color: TEAL }}>${thresholdAmount}</span>{' '}
            (<span className="text-white">{threshold}%</span>) to unlock their results.
          </p>
        </div>

        <p className="text-[10px] text-gray-600 font-montserrat mt-4">
          Last updated: <span className="text-gray-500">{fmtTs(gateMeta.updatedAt)}</span>
          {gateMeta.updatedBy && <> · by <span className="text-gray-500">{gateMeta.updatedBy}</span></>}
        </p>
      </div>

      {/* Danger zone */}
      <div className="bg-[#0D1C35] border border-red-500/20 rounded-xl p-6">
        <h3 className="font-playfair font-semibold text-white mb-2">Sign Out</h3>
        <p className="text-sm text-gray-400 font-montserrat mb-4">You will be returned to the login page.</p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 rounded-xl text-sm font-semibold font-montserrat text-red-400 border border-red-500/30 hover:bg-red-500/10 transition"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
