import { QRCodeSVG } from 'qrcode.react'
import { MdPrint } from 'react-icons/md'

const REASON_COLORS = {
  'Weekend Visit':        '#3b82f6',
  'Medical / Sick Leave': '#22c55e',
  'Sent Home (Fees)':     '#f59e0b',
  'Bereavement':          '#9ca3af',
  'Family Emergency':     '#a855f7',
  'Other':                '#a855f7',
}

function fmtDate(d) {
  if (!d) return '—'
  try {
    const date = typeof d === 'string' ? new Date(d) : d?.toDate ? d.toDate() : new Date(d)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return String(d) }
}

function fmtDateTime(d) {
  if (!d) return '—'
  try {
    const date = d?.toDate ? d.toDate() : new Date(d)
    return (
      date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ' at ' +
      date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    )
  } catch { return '—' }
}

function buildPassage(data) {
  const { studentName, reg_number, class: cls, reason, returnDate } = data
  const ret = fmtDate(returnDate)
  const id  = `${studentName}, Reg No ${reg_number}, of ${cls}`
  switch (reason) {
    case 'Weekend Visit':
      return `This is to certify that ${id}, has been granted permission to proceed home for a weekend visit. The student is expected to return by ${ret}. This pass has been issued by the school administration and is valid for the dates stated herein.`
    case 'Medical / Sick Leave':
      return `This is to certify that ${id}, has been granted medical leave from school. Supporting medical documentation has been submitted and is on record. The student is expected to return by ${ret} upon recovery.`
    case 'Sent Home (Fees)':
      return `This is to certify that ${id}, has been temporarily released from school premises pending settlement of outstanding fee obligations. The student is expected to return with proof of payment by ${ret}.`
    case 'Bereavement':
      return `This is to certify that ${id}, has been granted compassionate leave following a bereavement. The student is expected to return by ${ret}.`
    default:
      return `This is to certify that ${id}, has been granted leave of absence from school. The student is expected to return by ${ret}.`
  }
}

export default function ExeatPass({ passData, allowPrint = false, onPrint }) {
  const color   = REASON_COLORS[passData?.reason] || '#a855f7'
  const passage = buildPassage(passData)
  const qrValue = `${passData.passSerial}|${passData.reg_number}|${passData.departureDate}|${passData.returnDate}|${passData.reason}`

  return (
    <div className="space-y-4">

      {allowPrint && (
        <div className="flex justify-end print:hidden">
          <button
            onClick={onPrint}
            className="flex items-center gap-2 bg-[#C9A84C] hover:bg-yellow-400 text-[#0A1628] font-montserrat text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-[#C9A84C]/20 transition-all"
          >
            <MdPrint className="text-base" />
            Print Pass
          </button>
        </div>
      )}

      <div
        id="opc-exeat-pass"
        className="bg-white mx-auto"
        style={{
          width: '148mm',
          minHeight: '210mm',
          border: `4px double ${color}`,
          outline: `2px solid ${color}`,
          outlineOffset: '-8px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Watermark — hidden on screen, visible on print */}
        <div
          className="hidden print:flex absolute inset-0 items-center justify-center pointer-events-none select-none overflow-hidden"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        >
          <span style={{
            fontSize: 48,
            fontWeight: 900,
            color: '#000',
            opacity: 0.05,
            transform: 'rotate(-45deg)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.1em',
            userSelect: 'none',
          }}>
            OASIS PRIVATE COLLEGE — OFFICIAL
          </span>
        </div>

        <div className="relative p-7" style={{ zIndex: 1 }}>

          {/* ── Header ── */}
          <div className="text-center mb-4 pb-4" style={{ borderBottom: `2px solid ${color}` }}>
            <div className="w-14 h-14 mx-auto mb-2 rounded-full border-2 overflow-hidden flex items-center justify-center bg-gray-50" style={{ borderColor: color }}>
              <img
                src="/assets/logo.png"
                alt="OPC"
                className="w-10 h-10 object-contain"
                onError={e => { e.currentTarget.parentElement.innerHTML = '<span style="font-size:1.1rem;font-weight:900;color:#1a3a5c">OPC</span>' }}
              />
            </div>
            <h1 className="font-bold text-sm tracking-widest text-gray-900 uppercase" style={{ fontFamily: 'Georgia, serif' }}>
              Oasis Private College
            </h1>
            <p className="text-[10px] text-gray-500 tracking-wider">Checheche, Zimbabwe</p>
            <div className="mt-2 inline-block px-4 py-0.5 border border-gray-400">
              <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-gray-700">Student Exit Pass (Exeat)</p>
            </div>
            <p className="text-[9px] font-mono font-bold text-gray-700 mt-1.5">{passData.passSerial}</p>
            <p className="text-[9px] text-gray-500">{passData.term} — {passData.year}</p>
          </div>

          {/* ── Student details ── */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Left col */}
            <div className="space-y-2">
              {passData.photoURL && (
                <img
                  src={passData.photoURL}
                  alt={passData.studentName}
                  className="w-20 h-20 rounded-full object-cover border-2 mb-2"
                  style={{ borderColor: color }}
                />
              )}
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Full Name</p>
                <p className="text-[12px] font-bold text-gray-900">{passData.studentName}</p>
              </div>
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Registration Number</p>
                <p className="text-[11px] font-bold text-gray-900 font-mono">{passData.reg_number}</p>
              </div>
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Class / Grade</p>
                <p className="text-[11px] font-bold text-gray-900">{passData.class}</p>
              </div>
            </div>

            {/* Right col */}
            <div className="space-y-2">
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Reason for Exit</p>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  {passData.reason}
                </span>
              </div>
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Departure Date</p>
                <p className="text-[11px] font-bold text-gray-900">{fmtDate(passData.departureDate)}</p>
              </div>
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Expected Return</p>
                <p className="text-[11px] font-bold text-gray-900">{fmtDate(passData.returnDate)}</p>
              </div>
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Destination</p>
                <p className="text-[11px] font-bold text-gray-900">{passData.destination}</p>
              </div>
            </div>
          </div>

          {/* ── Guardian details ── */}
          <div className="border border-gray-200 rounded px-3 py-2.5 mb-4 bg-gray-50">
            <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-1.5">Guardian / Parent Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[7px] text-gray-400">Name</p>
                <p className="text-[11px] font-bold text-gray-900">{passData.guardianName}</p>
              </div>
              <div>
                <p className="text-[7px] text-gray-400">Phone</p>
                <p className="text-[11px] font-bold text-gray-900">{passData.guardianPhone}</p>
              </div>
            </div>
          </div>

          {/* ── Authorization passage ── */}
          <div className="rounded px-3 py-2.5 mb-4 border-2" style={{ borderColor: color, backgroundColor: `${color}08` }}>
            <p className="text-[7px] uppercase tracking-widest mb-1" style={{ color }}>Authorization Statement</p>
            <p className="text-[9px] leading-relaxed text-gray-800 italic">{passage}</p>
          </div>

          {/* ── Security row ── */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Issued</p>
                <p className="text-[10px] text-gray-800">{fmtDateTime(passData.issuedAt)}</p>
              </div>
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Authorized By</p>
                <p className="text-[10px] text-gray-800">{passData.issuedBy}</p>
                <p className="text-gray-300 font-mono text-[10px] mt-0.5">____________________</p>
                <p className="text-[7px] text-gray-400">Student Administrator</p>
              </div>
              <div>
                <p className="text-[7px] uppercase tracking-widest text-gray-400 mb-0.5">Supporting Document</p>
                <p className="text-[9px] text-gray-700">
                  {passData.documentName ? `On file: ${passData.documentName}` : 'No supporting document submitted'}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1">
              <QRCodeSVG value={qrValue} size={76} level="M" />
              <p className="text-[7px] text-gray-400 text-center font-mono">Scan to verify</p>
            </div>
          </div>

          {/* ── Validity notice ── */}
          <div className="bg-gray-100 rounded px-3 py-2 mb-4 space-y-0.5">
            <p className="text-[8px] text-gray-500">• This pass is valid for the travel dates stated only.</p>
            <p className="text-[8px] text-gray-500">• Any alterations to this document render it invalid.</p>
            <p className="text-[8px] text-gray-500">• This pass must be surrendered upon return to school.</p>
            <p className="text-[8px] text-gray-500">• Report any found passes to the school office immediately.</p>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-200">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-14 h-14 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                <p className="text-[7px] text-gray-400 text-center uppercase leading-tight tracking-wide">Official<br />Stamp</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[7px] text-gray-400 font-mono">{passData.passSerial}</p>
              <p className="text-[7px] text-gray-400">Oasis Private College | Checheche, Zimbabwe</p>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #opc-exeat-pass, #opc-exeat-pass * { visibility: visible !important; }
          #opc-exeat-pass {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 148mm !important;
            min-height: 210mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }
          #opc-exeat-pass p,
          #opc-exeat-pass span,
          #opc-exeat-pass h1,
          #opc-exeat-pass h2 { color: #111 !important; }
          @page { size: A5 portrait; margin: 10mm; }
        }
      `}</style>
    </div>
  )
}
