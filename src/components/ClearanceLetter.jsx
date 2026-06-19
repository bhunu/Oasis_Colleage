import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, getDocs, query, collection, where, limit, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase/config'
import { QRCodeSVG } from 'qrcode.react'
import { MdPrint, MdDownload } from 'react-icons/md'
import toast from 'react-hot-toast'
import sc from '../utils/schoolConfig'

const VERIFY_BASE = 'https://oasiscollegeplacholder.ac.zw/verify'

const EXIT_LABELS = {
  OLevelCompletion: 'O Level Graduate',
  ALevelCompletion: 'A Level Graduate',
  Transfer:         'Transfer Student',
}

const BORDER_COLOR = {
  OLevelCompletion: '#22c55e',
  ALevelCompletion: '#3b82f6',
  Transfer:         '#f59e0b',
}

function pronoun(gender = '') {
  const g = gender.toLowerCase()
  if (g === 'male')   return { obj: 'him', poss: 'his' }
  if (g === 'female') return { obj: 'her', poss: 'her' }
  return { obj: 'them', poss: 'their' }
}

function certBody(data, student) {
  const p = pronoun(student?.gender)
  const clearDate = data.issuedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) || '—'
  const enrolDate = student?.enrolmentDate || student?.enrollmentDate || '—'
  const name    = data.studentName
  const regNo   = data.reg_number
  if (data.exitType === 'OLevelCompletion') {
    return `This is to certify that ${name}, Registration Number ${regNo}, was a registered student at ${sc.name} from ${enrolDate} to ${clearDate}, having successfully completed the Ordinary Level (O Level) programme. This letter serves as confirmation that the above-named student has met all financial obligations to the school, including settlement of all current and arrear fees, and has been duly cleared by the school administration. The school wishes ${p.obj} well in future academic and personal endeavours.`
  }
  if (data.exitType === 'ALevelCompletion') {
    return `This is to certify that ${name}, Registration Number ${regNo}, was a registered student at ${sc.name} from ${enrolDate} to ${clearDate}, having successfully completed the Advanced Level (A Level) programme. This letter serves as confirmation that the above-named student has met all financial obligations to the school, including settlement of all current and arrear fees, and has been duly cleared by the school administration. The school wishes ${p.obj} every success in future academic pursuits and career endeavours.`
  }
  return `This is to certify that ${name}, Registration Number ${regNo}, was a registered student at ${sc.name} from ${enrolDate} to ${clearDate}. The student has been granted permission to transfer to ${data.destinationSchool || '[Destination School]'}. This letter serves as confirmation that the above-named student has met all financial obligations to the school, including settlement of all current and arrear fees, and has been duly cleared by the school administration. The school wishes ${p.obj} well at ${data.destinationSchool || '[Destination School]'}.`
}

function buildPrintHTML({ data, schoolInfo, student, qrSvg, feeAccount }) {
  const root = document.documentElement
  const cssGold = getComputedStyle(root).getPropertyValue('--color-primary-hex').trim() || '#C9A84C'
  const cssNavy = getComputedStyle(root).getPropertyValue('--color-navy-hex').trim() || '#0A1628'
  const borderColor = BORDER_COLOR[data.exitType] || cssGold
  const clearDate = data.issuedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) || '—'
  const issueTime = data.issuedAt?.toDate?.()?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) || '—'
  const body    = certBody(data, student)
  const termFees  = feeAccount?.termFees  || data.totalFees  || 0
  const arrears   = feeAccount?.arrears   || data.arrears    || 0
  const verifyURL = `${VERIFY_BASE}/${data.clearanceSerial}`
  const photoLine = student?.photoURL
    ? `<img src="${student.photoURL}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid ${getComputedStyle(document.documentElement).getPropertyValue('--color-primary-hex').trim() || '#C9A84C'};" />`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Clearance Letter — ${data.studentName}</title>
  <style>
    @page { size: A4 portrait; margin: 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
    .page { position: relative; min-height: 100%; border-left: 6px solid ${borderColor}; padding-left: 18px; }
    .watermark {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 56px; font-weight: 900; color: rgba(0,0,0,0.04);
      white-space: nowrap; pointer-events: none; letter-spacing: 4px;
      font-family: Arial, sans-serif; z-index: 0;
    }
    .letterhead { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 14px; border-bottom: 2px solid ${cssGold}; margin-bottom: 18px; }
    .school-name { font-size: 17px; font-weight: bold; color: ${cssNavy}; }
    .school-sub  { font-size: 10px; color: #666; margin-top: 2px; }
    .serial-block { text-align: right; font-size: 10px; color: #555; }
    .serial-mono { font-family: monospace; font-size: 11px; font-weight: bold; color: ${cssGold}; }
    .recipient { margin: 14px 0; font-size: 12px; }
    .subject { text-align: center; font-size: 13px; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin: 14px 0; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 16px 0; }
    .detail-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 3px; }
    .detail-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }
    .cert-body { margin: 18px 0; font-size: 12px; line-height: 1.8; text-align: justify; }
    .fee-box { border: 1px solid ${cssGold}; border-radius: 6px; padding: 14px; margin: 18px 0; background: #fffdf5; }
    .fee-box-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: ${cssGold}; margin-bottom: 10px; }
    .fee-row { display: flex; justify-content: space-between; font-size: 11px; margin: 4px 0; color: #333; }
    .fee-row.total { font-weight: bold; border-top: 1px dashed ${cssGold}; padding-top: 6px; margin-top: 6px; color: #166534; }
    .security-notices { font-size: 9px; color: #888; margin: 14px 0; line-height: 1.7; }
    .stamp { width: 110px; height: 110px; border: 2px dashed #aaa; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; color: #aaa; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; }
    .sig-line { margin-top: 40px; }
    .sig-underline { width: 200px; border-bottom: 1px solid #1a1a1a; margin-bottom: 4px; }
    .sig-name { font-size: 12px; font-weight: bold; }
    .sig-title { font-size: 10px; color: #555; }
    .bottom-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; }
    .qr-block { text-align: center; }
    .qr-label { font-size: 8px; color: #888; margin-top: 4px; }
    .footer { border-top: 1px solid #ddd; margin-top: 18px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; }
    .timestamp { font-size: 9px; color: #888; margin-top: 6px; }
    @media print { .watermark { display: block; } }
  </style>
</head>
<body>
  <div class="watermark">${sc.name.toUpperCase()} — CLEARED</div>
  <div class="page">
    <!-- Letterhead -->
    <div class="letterhead">
      <div style="display:flex;align-items:center;gap:14px;">
        <img src="/assets/logo.png" style="width:64px;height:64px;object-fit:contain;" onerror="this.style.display='none'" />
        <div>
          <div class="school-name">${schoolInfo?.schoolName || sc.name}</div>
          <div class="school-sub">${schoolInfo?.address || sc.address}</div>
          <div class="school-sub">Tel: ${schoolInfo?.phone || '—'} | Email: ${schoolInfo?.email || '—'}</div>
        </div>
      </div>
      <div class="serial-block">
        <div>Clearance Serial:</div>
        <div class="serial-mono">${data.clearanceSerial}</div>
        <div style="margin-top:6px;">Date of Issue: ${clearDate}</div>
        <div class="timestamp">Issued: ${clearDate} at ${issueTime}</div>
      </div>
    </div>

    <div class="recipient">To Whom It May Concern,</div>

    <div class="subject">RE: Student Clearance Letter — ${data.studentName} (${data.reg_number})</div>

    <!-- Student details -->
    <div class="details-grid">
      <div>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
          ${photoLine}
          <div>
            <div class="detail-label">Full Name</div>
            <div class="detail-value">${data.studentName}</div>
          </div>
        </div>
        <div style="margin-bottom:8px;"><div class="detail-label">Registration Number</div><div class="detail-value" style="font-family:monospace;">${data.reg_number}</div></div>
        <div style="margin-bottom:8px;"><div class="detail-label">Class / Form</div><div class="detail-value">${data.class || '—'}</div></div>
        <div style="margin-bottom:8px;"><div class="detail-label">Date of Enrolment</div><div class="detail-value">${student?.enrolmentDate || '—'}</div></div>
      </div>
      <div>
        <div style="margin-bottom:8px;"><div class="detail-label">Exit Type</div><div class="detail-value">${EXIT_LABELS[data.exitType] || data.exitType}</div></div>
        ${data.destinationSchool ? `<div style="margin-bottom:8px;"><div class="detail-label">Destination School</div><div class="detail-value">${data.destinationSchool}</div></div>` : ''}
        <div style="margin-bottom:8px;"><div class="detail-label">Date of Clearance</div><div class="detail-value">${clearDate}</div></div>
        <div style="margin-bottom:8px;"><div class="detail-label">Guardian Name</div><div class="detail-value">${data.guardianName || '—'}</div></div>
        <div style="margin-bottom:8px;"><div class="detail-label">Guardian Phone</div><div class="detail-value">${data.guardianPhone || '—'}</div></div>
      </div>
    </div>

    <div class="cert-body">${body}</div>

    <!-- Fee clearance box -->
    <div class="fee-box">
      <div class="fee-box-title">Financial Clearance Confirmed</div>
      <div class="fee-row"><span>Total Fees Paid</span><span>$${Number(termFees).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      <div class="fee-row"><span>Arrears Cleared</span><span>$${Number(arrears).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
      <div class="fee-row total"><span>Outstanding Balance</span><span>$0.00</span></div>
      <div class="fee-row" style="margin-top:8px;font-size:10px;color:#555;"><span>Verified By</span><span>${data.issuedBy}</span></div>
      <div class="fee-row" style="font-size:10px;color:#555;"><span>Verified On</span><span>${data.feesVerifiedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) || clearDate}</span></div>
    </div>

    <p>Yours faithfully,</p>

    <div class="sig-line">
      <div class="sig-underline"></div>
      <div class="sig-name">${data.issuedBy}</div>
      <div class="sig-title">Student Administrator</div>
      <div class="sig-title">On behalf of ${sc.name}</div>
    </div>

    <!-- Security notices -->
    <div class="security-notices">
      This letter is issued once and is non-transferable. &nbsp;|&nbsp;
      Any alterations to this document render it null and void. &nbsp;|&nbsp;
      Verify authenticity by scanning the QR code above. &nbsp;|&nbsp;
      Issued under the authority of ${sc.name}.
    </div>

    <div class="bottom-row">
      <div class="stamp">Official<br/>Stamp</div>
      <div class="qr-block">
        ${qrSvg}
        <div class="qr-label">Scan to verify authenticity</div>
        <div class="qr-label" style="margin-top:2px;font-family:monospace;">${data.clearanceSerial}</div>
      </div>
    </div>

    <div class="footer">
      <span style="font-family:monospace;">${data.clearanceSerial}</span>
      <span>${sc.name} | ${schoolInfo?.address || sc.address}</span>
      <span>Page 1 of 1</span>
    </div>
  </div>
</body>
</html>`
}

export default function ClearanceLetter({ clearanceData, mode = 'student' }) {
  const [schoolInfo,  setSchoolInfo]  = useState(null)
  const [student,     setStudent]     = useState(null)
  const [feeAccount,  setFeeAccount]  = useState(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [counts,      setCounts]      = useState({
    studentPrintCount:  clearanceData?.studentPrintCount  ?? 0,
    adminPrintCount:    clearanceData?.adminPrintCount    ?? 0,
    adminDownloadCount: clearanceData?.adminDownloadCount ?? 0,
  })
  const [working, setWorking] = useState(false)
  const qrRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const [infoSnap, stuSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'schoolInfo')),
          getDocs(query(collection(db, 'students'), where('reg_number', '==', clearanceData.reg_number), limit(1))),
        ])
        if (infoSnap.exists()) setSchoolInfo(infoSnap.data())
        if (!stuSnap.empty)    setStudent(stuSnap.docs[0].data())

        const feeSnap = await getDocs(
          query(collection(db, 'feeAccounts'), where('reg_number', '==', clearanceData.reg_number), limit(1))
        )
        if (!feeSnap.empty) setFeeAccount(feeSnap.docs[0].data())
      } catch {}
      finally { setLoadingMeta(false) }
    }
    load()
  }, [clearanceData.reg_number])

  if (loadingMeta) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const verifyURL = `${VERIFY_BASE}/${clearanceData.clearanceSerial}`
  const borderColor = BORDER_COLOR[clearanceData.exitType] || getComputedStyle(document.documentElement).getPropertyValue('--color-primary-hex').trim() || '#C9A84C'
  const clearDate = clearanceData.issuedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) || '—'
  const issueTime = clearanceData.issuedAt?.toDate?.()?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) || '—'

  const triggerPrintWindow = (html) => {
    const win = window.open('', '_blank', 'width=820,height=1000')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); }, 800)
  }

  const handleStudentPrint = async () => {
    if (counts.studentPrintCount >= 1) return
    setWorking(true)
    try {
      await updateDoc(doc(db, 'clearancePasses', clearanceData.clearanceSerial), {
        studentPrintCount: increment(1),
      })
      setCounts(c => ({ ...c, studentPrintCount: c.studentPrintCount + 1 }))
      const qrSvg = qrRef.current?.querySelector('svg')?.outerHTML || ''
      triggerPrintWindow(buildPrintHTML({ data: clearanceData, schoolInfo, student, qrSvg, feeAccount }))
      toast.success('Print dialog opened.')
    } catch { toast.error('Print failed. Please try again.') }
    finally { setWorking(false) }
  }

  const handleAdminPrint = async () => {
    if (counts.adminPrintCount >= 2) return
    setWorking(true)
    try {
      await updateDoc(doc(db, 'clearancePasses', clearanceData.clearanceSerial), {
        adminPrintCount: increment(1),
      })
      setCounts(c => ({ ...c, adminPrintCount: c.adminPrintCount + 1 }))
      const qrSvg = qrRef.current?.querySelector('svg')?.outerHTML || ''
      triggerPrintWindow(buildPrintHTML({ data: clearanceData, schoolInfo, student, qrSvg, feeAccount }))
      toast.success('Print dialog opened.')
    } catch { toast.error('Print failed. Please try again.') }
    finally { setWorking(false) }
  }

  const handleAdminDownload = async () => {
    if (counts.adminDownloadCount >= 2) return
    setWorking(true)
    try {
      await updateDoc(doc(db, 'clearancePasses', clearanceData.clearanceSerial), {
        adminDownloadCount: increment(1),
      })
      setCounts(c => ({ ...c, adminDownloadCount: c.adminDownloadCount + 1 }))
      const qrSvg = qrRef.current?.querySelector('svg')?.outerHTML || ''
      const html  = buildPrintHTML({ data: clearanceData, schoolInfo, student, qrSvg, feeAccount })
      const blob  = new Blob([html], { type: 'text/html' })
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement('a')
      a.href      = url
      a.download  = `Clearance_${clearanceData.reg_number}_${clearanceData.clearanceSerial}.html`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Letter downloaded. Open in a browser and print to PDF.')
    } catch { toast.error('Download failed. Please try again.') }
    finally { setWorking(false) }
  }

  /* ─── Rendered letter preview (screen only) ─── */
  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {mode === 'student' && (
          counts.studentPrintCount >= 1
            ? <p className="font-montserrat text-xs text-gray-500 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                This letter has already been printed. Please contact the school administration if you need another copy.
              </p>
            : <button
                onClick={handleStudentPrint}
                disabled={working}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-montserrat font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                <MdPrint /> Print Letter
              </button>
        )}

        {mode === 'admin' && (
          <>
            {counts.adminPrintCount >= 2
              ? <p className="font-montserrat text-xs text-gray-500 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                  Print limit reached. Download is still available for filing purposes.
                </p>
              : <button
                  onClick={handleAdminPrint}
                  disabled={working}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-montserrat font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  <MdPrint /> Print ({2 - counts.adminPrintCount} left)
                </button>
            }
            {counts.adminDownloadCount >= 2
              ? <p className="font-montserrat text-xs text-gray-500 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                  Download limit reached for this clearance letter.
                </p>
              : <button
                  onClick={handleAdminDownload}
                  disabled={working}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-montserrat font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  <MdDownload /> Download PDF ({2 - counts.adminDownloadCount} left)
                </button>
            }
          </>
        )}
      </div>

      {/* Hidden QR for extraction */}
      <div ref={qrRef} className="hidden" aria-hidden>
        <QRCodeSVG value={verifyURL} size={80} />
      </div>

      {/* Letter preview */}
      <div
        className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl"
        style={{ borderLeft: `6px solid ${borderColor}`, fontFamily: 'Arial, sans-serif', fontSize: '13px' }}
      >
        <div className="p-8">
          {/* Letterhead */}
          <div className="flex items-start justify-between pb-4 mb-5" style={{ borderBottom: '2px solid var(--color-primary-hex)' }}>
            <div className="flex items-center gap-4">
              <img src="/assets/logo.png" alt="" className="w-16 h-16 object-contain" onError={e => { e.target.style.display = 'none' }} />
              <div>
                <p className="font-bold text-lg" style={{ color: 'var(--color-navy-hex)' }}>{schoolInfo?.schoolName || sc.name}</p>
                <p className="text-xs text-gray-500">{schoolInfo?.address || sc.address}</p>
                <p className="text-xs text-gray-500">Tel: {schoolInfo?.phone || '—'} | Email: {schoolInfo?.email || '—'}</p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Clearance Serial:</p>
              <p className="font-mono font-bold text-gold text-sm mt-0.5">{clearanceData.clearanceSerial}</p>
              <p className="mt-1.5">Date of Issue: {clearDate}</p>
              <p className="text-[10px] mt-0.5">Issued: {clearDate} at {issueTime}</p>
            </div>
          </div>

          <p className="mb-4 text-sm">To Whom It May Concern,</p>

          <p className="text-center font-bold text-sm underline uppercase mb-5 tracking-wide">
            RE: Student Clearance Letter — {clearanceData.studentName} ({clearanceData.reg_number})
          </p>

          {/* Student details */}
          <div className="grid grid-cols-2 gap-6 mb-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-3">
                {student?.photoURL && (
                  <img src={student.photoURL} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gold" />
                )}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400">Full Name</p>
                  <p className="font-semibold text-sm">{clearanceData.studentName}</p>
                </div>
              </div>
              <DRow label="Registration Number" value={<span className="font-mono font-bold">{clearanceData.reg_number}</span>} />
              <DRow label="Class / Form"        value={clearanceData.class} />
              <DRow label="Date of Enrolment"   value={student?.enrolmentDate || '—'} />
            </div>
            <div className="space-y-3">
              <DRow label="Exit Type"       value={<span className="font-semibold">{EXIT_LABELS[clearanceData.exitType] || clearanceData.exitType}</span>} />
              {clearanceData.destinationSchool && <DRow label="Destination School" value={clearanceData.destinationSchool} />}
              <DRow label="Date of Clearance" value={clearDate} />
              <DRow label="Guardian Name"     value={clearanceData.guardianName} />
              <DRow label="Guardian Phone"    value={clearanceData.guardianPhone} />
            </div>
          </div>

          {/* Body */}
          <p className="text-sm leading-7 text-justify mb-5">{certBody(clearanceData, student)}</p>

          {/* Fee box */}
          <div className="border rounded-lg p-4 mb-5" style={{ borderColor: 'var(--color-primary-hex)', background: '#fffdf5' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary-hex)' }}>
              Financial Clearance Confirmed
            </p>
            <div className="space-y-1.5 text-xs">
              <FeeRow label="Total Fees Paid"    value={`$${Number(feeAccount?.termFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
              <FeeRow label="Arrears Cleared"    value={`$${Number(feeAccount?.arrears || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
              <FeeRow label="Outstanding Balance" value="$0.00" bold green />
              <FeeRow label="Verified By"         value={clearanceData.issuedBy} />
              <FeeRow label="Verified On"         value={clearanceData.feesVerifiedAt?.toDate?.()?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) || clearDate} />
            </div>
          </div>

          <p className="text-sm mb-6">Yours faithfully,</p>

          <div className="mb-6">
            <div className="w-44 border-b border-gray-700 mb-1" />
            <p className="font-bold text-sm">{clearanceData.issuedBy}</p>
            <p className="text-xs text-gray-500">Student Administrator</p>
            <p className="text-xs text-gray-500">On behalf of {sc.name}</p>
          </div>

          <p className="text-[9px] text-gray-400 leading-6 mb-4">
            This letter is issued once and is non-transferable. &nbsp;|&nbsp;
            Any alterations to this document render it null and void. &nbsp;|&nbsp;
            Verify authenticity by scanning the QR code. &nbsp;|&nbsp;
            Issued under the authority of {sc.name}.
          </p>

          <div className="flex justify-between items-end">
            <div className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-[9px] font-bold uppercase text-gray-400 tracking-wide text-center leading-tight">
              Official<br/>Stamp
            </div>
            <div className="text-center">
              <QRCodeSVG value={verifyURL} size={80} />
              <p className="text-[8px] text-gray-400 mt-1">Scan to verify authenticity</p>
              <p className="text-[8px] font-mono text-gray-400">{clearanceData.clearanceSerial}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-5 pt-3 text-[9px] text-gray-300" style={{ borderTop: '1px solid #e5e7eb' }}>
            <span className="font-mono">{clearanceData.clearanceSerial}</span>
            <span>{sc.name} | {schoolInfo?.address || sc.address}</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DRow({ label, value }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

function FeeRow({ label, value, bold, green }) {
  return (
    <div className="flex justify-between">
      <span className={`text-gray-600 ${bold ? 'font-bold pt-1 border-t border-dashed border-gold w-full' : ''}`}>{label}</span>
      <span className={bold ? `font-bold ${green ? 'text-green-700' : ''}` : 'text-gray-700'}>{value}</span>
    </div>
  )
}
