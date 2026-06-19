import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { MdAdd, MdDelete } from 'react-icons/md'
import toast from 'react-hot-toast'

const TEAL  = '#0F6E56'
const NAVY2 = '#378ADD'
const CARD  = 'bg-navy-800 border border-white/10 rounded-xl p-6'

function fmt(v) { return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }

function Row({ label, value, bold, color, indent }) {
  return (
    <div className={`flex justify-between py-2 border-b border-white/5 font-montserrat text-sm ${indent ? 'pl-4' : ''}`}>
      <span className={bold ? 'font-semibold text-white' : 'text-gray-400'}>{label}</span>
      <span className={bold ? 'font-bold' : ''} style={{ color: color || (bold ? '#fff' : '#9ca3af') }}>{fmt(value)}</span>
    </div>
  )
}

export default function BalanceSheet() {
  const [asAt,       setAsAt]       = useState(new Date().toISOString().split('T')[0])
  const [assetItems, setAssetItems] = useState([])
  const [cash,       setCash]       = useState(0)
  const [receivables,setReceivables]= useState(0)
  const [deferred,   setDeferred]   = useState(0)
  const [expTotal,   setExpTotal]   = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [assetForm,  setAssetForm]  = useState({ name: '', value: '' })
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    let pending = 3
    const done = () => { if (--pending === 0) setLoading(false) }

    getDocs(collection(db, 'assets'))
      .then(snap => setAssetItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {}).finally(done)

    getDocs(collection(db, 'feeAccounts'))
      .then(snap => {
        let totalPaid = 0, arr = 0, credit = 0
        snap.forEach(d => {
          const data = d.data()
          totalPaid += Number(data.totalPaid || 0)
          if (data.balanceType === 'debit')  arr    += Number(data.balance || 0)
          if (data.balanceType === 'credit') credit += Number(data.balance || 0)
        })
        setCash(totalPaid)
        setReceivables(arr)
        setDeferred(credit)
      })
      .catch(() => {}).finally(done)

    getDocs(collection(db, 'expenses'))
      .then(snap => setExpTotal(snap.docs.reduce((s, d) => s + Number(d.data().amount || 0), 0)))
      .catch(() => {}).finally(done)
  }, [])

  const equipmentTotal   = assetItems.reduce((s, a) => s + Number(a.value || 0), 0)
  const assetsTotal      = cash + receivables + equipmentTotal
  const liabilitiesTotal = expTotal + deferred
  const netPosition      = assetsTotal - liabilitiesTotal

  const addAsset = async () => {
    if (!assetForm.name.trim() || !assetForm.value) return
    setSaving(true)
    try {
      const ref = await addDoc(collection(db, 'assets'), {
        name:    assetForm.name.trim(),
        value:   Number(assetForm.value),
        addedAt: serverTimestamp(),
      })
      setAssetItems(prev => [...prev, { id: ref.id, name: assetForm.name.trim(), value: Number(assetForm.value) }])
      setAssetForm({ name: '', value: '' })
      toast.success('Asset added')
    } catch { toast.error('Failed to add asset') }
    finally { setSaving(false) }
  }

  const removeAsset = async (id) => {
    try {
      await deleteDoc(doc(db, 'assets', id))
      setAssetItems(prev => prev.filter(a => a.id !== id))
      toast.success('Asset removed')
    } catch { toast.error('Failed to remove asset') }
  }

  const handleCSV = () => {
    const rows = [
      ['Balance Sheet', `As at ${asAt}`],
      [],
      ['ASSETS'],
      ['Fees collected (cash)',        cash],
      ['Fees receivable (arrears)',    receivables],
      ...assetItems.map(a => [a.name, a.value]),
      ['Total Assets',                 assetsTotal],
      [],
      ['LIABILITIES'],
      ['Total expenses recorded',      expTotal],
      ['Deferred income (overpayments)', deferred],
      ['Total Liabilities',            liabilitiesTotal],
      [],
      ['Net Position',                 netPosition],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `balance-sheet-${asAt}.csv`
    a.click()
    toast.success('CSV exported')
  }

  return (
    <>
      <style>{`@media print { body > * { display:none!important; } #balance-sheet { display:block!important; } }`}</style>

      <div id="balance-sheet" className="max-w-2xl mx-auto space-y-6">

        {/* Controls */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs text-gray-500 font-montserrat uppercase tracking-widest shrink-0">As at</label>
            <input
              type="date" value={asAt} onChange={e => setAsAt(e.target.value)}
              className="bg-white/5 border border-white/10 text-gray-300 rounded-xl px-4 py-2.5 text-sm font-montserrat focus:outline-none flex-1"
            />
          </div>
          <button onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-white border border-white/20 hover:bg-white/5 transition">
            Print
          </button>
          <button onClick={handleCSV}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-white transition"
            style={{ backgroundColor: TEAL }}>
            Export CSV
          </button>
        </div>

        {/* Balance sheet statement */}
        <div className={CARD}>
          <div className="text-center mb-6 pb-4 border-b border-white/10">
            <h2 className="font-playfair text-xl font-bold text-white">OASIS PRIVATE COLLEGE</h2>
            <p className="text-sm font-montserrat text-gray-400 mt-0.5">Balance Sheet</p>
            <p className="text-xs font-montserrat text-gray-500 mt-0.5">
              As at {new Date(asAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 font-montserrat text-sm py-8">Loading…</p>
          ) : (
            <>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-2">Assets</p>
              <Row label="Fees collected (cash)"     value={cash}        indent />
              <Row label="Fees receivable (arrears)" value={receivables} indent />
              {assetItems.map(a => (
                <Row key={a.id} label={a.name} value={a.value} indent />
              ))}
              {assetItems.length === 0 && (
                <p className="pl-4 py-1 text-xs text-gray-600 font-montserrat">
                  No physical assets recorded — add them in the register below.
                </p>
              )}
              <Row label="Total Assets" value={assetsTotal} bold color={TEAL} />

              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-2 mt-5">Liabilities</p>
              <Row label="Total expenses recorded"        value={expTotal}         indent />
              <Row label="Deferred income (overpayments)" value={deferred}         indent />
              <Row label="Total Liabilities"              value={liabilitiesTotal} bold color="#E24B4A" />

              <div className="mt-4 p-4 rounded-xl flex justify-between items-center"
                style={{ backgroundColor: netPosition >= 0 ? `${NAVY2}18` : '#e24b4a18' }}>
                <span className="font-bold text-white font-montserrat">Net Position</span>
                <span className="font-bold text-xl font-playfair"
                  style={{ color: netPosition >= 0 ? NAVY2 : '#E24B4A' }}>{fmt(netPosition)}</span>
              </div>
            </>
          )}
        </div>

        {/* Asset register */}
        <div className={CARD}>
          <h3 className="font-playfair font-semibold text-white mb-1">Asset Register</h3>
          <p className="text-xs text-gray-500 font-montserrat mb-5">
            Record physical assets (equipment, furniture, vehicles) to include in the balance sheet.
          </p>

          {/* Add form */}
          <div className="flex gap-3 mb-5">
            <input
              type="text"
              placeholder="Asset name (e.g. Computers ×10)"
              value={assetForm.name}
              onChange={e => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addAsset()}
              className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm font-montserrat focus:outline-none focus:border-gold/50 transition"
            />
            <input
              type="number"
              placeholder="Value ($)"
              value={assetForm.value}
              onChange={e => setAssetForm(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addAsset()}
              className="w-36 bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm font-montserrat focus:outline-none focus:border-gold/50 transition"
            />
            <button
              onClick={addAsset}
              disabled={saving || !assetForm.name.trim() || !assetForm.value}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold font-montserrat text-navy transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary-hex)' }}
            >
              <MdAdd className="text-lg" />
              Add
            </button>
          </div>

          {/* Asset list */}
          {assetItems.length === 0 ? (
            <p className="text-center text-sm text-gray-600 font-montserrat py-4">No assets recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {assetItems.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm text-white font-montserrat">{a.name}</p>
                    <p className="text-xs font-montserrat mt-0.5" style={{ color: TEAL }}>{fmt(a.value)}</p>
                  </div>
                  <button
                    onClick={() => removeAsset(a.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                    title="Remove asset"
                  >
                    <MdDelete className="text-lg" />
                  </button>
                </div>
              ))}
              <div className="flex justify-between px-4 pt-3 border-t border-white/10">
                <span className="text-sm font-semibold text-white font-montserrat">Total Equipment &amp; Assets</span>
                <span className="text-sm font-bold font-montserrat" style={{ color: TEAL }}>{fmt(equipmentTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
