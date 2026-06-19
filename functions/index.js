const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule }        = require('firebase-functions/v2/scheduler')
const { defineSecret }      = require('firebase-functions/params')
const admin                 = require('firebase-admin')
const crypto                = require('crypto')
const nodemailer            = require('nodemailer')

admin.initializeApp()
const db = admin.firestore()

const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD')

// ---------------------------------------------------------------------------
// verifyStudentPassword — callable HTTPS function
// ---------------------------------------------------------------------------
exports.verifyStudentPassword = onCall({ region: 'us-central1' }, async (request) => {
  const { regNumber, password } = request.data ?? {}

  if (!regNumber || !password) {
    throw new HttpsError('invalid-argument', 'regNumber and password are required.')
  }

  const studentSnap = await db.collection('students')
    .where('reg_number', '==', regNumber)
    .limit(1)
    .get()

  const studentDoc  = studentSnap.empty ? null : studentSnap.docs[0]
  const studentData = studentDoc?.data() ?? {}

  let userDoc = null

  const byRegSnap = await db.collection('users')
    .where('regNumber', '==', regNumber)
    .limit(5)
    .get()
  userDoc = byRegSnap.docs.find(d => {
    const data = d.data()
    return data.role === 'student' && data.hasSetupPassword === true
  }) ?? null

  if (!userDoc && studentDoc) {
    const byIdSnap = await db.collection('users')
      .where('studentId', '==', studentDoc.id)
      .limit(5)
      .get()
    userDoc = byIdSnap.docs.find(d => {
      const data = d.data()
      return data.role === 'student' && data.hasSetupPassword === true
    }) ?? null
  }

  if (!userDoc) {
    throw new HttpsError('not-found', 'No account found. Use "First time (OTP)" if this is your first login.')
  }

  const userData = userDoc.data()

  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex')
  const md5Hash    = crypto.createHash('md5').update(password).digest('hex')

  if (sha256Hash !== userData.password) {
    if (md5Hash !== userData.password) {
      throw new HttpsError('unauthenticated', 'Invalid credentials.')
    }
    await userDoc.ref.update({ password: sha256Hash }).catch(() => {})
  }

  return {
    sessionData: {
      uid:              userDoc.id,
      studentId:        regNumber,
      studentDocId:     studentDoc?.id ?? null,
      hasSetupPassword: true,
      name:             studentData.fullName        || userData.name            || '',
      class:            studentData.class           || '',
      dateOfBirth:      studentData.dateOfBirth     || '',
      guardianName:     studentData.guardianName    || studentData.parentName   || '',
      guardianPhone:    studentData.guardianPhone   || studentData.parentPhone  || '',
      guardianEmail:    studentData.guardianEmail   || studentData.parentEmail  || '',
      email:            studentData.email           || studentData.studentEmail || '',
      phone:            studentData.phone           || '',
      hasEmail:         studentData.hasEmail        ?? (!!studentData.email || !!studentData.studentEmail),
      regNumber:        studentData.reg_number      || regNumber,
    },
  }
})

// ---------------------------------------------------------------------------
// sendBiWeeklyAttendanceReport — runs every 2nd Friday at 16:00 CAT
// ---------------------------------------------------------------------------
exports.sendBiWeeklyAttendanceReport = onSchedule(
  {
    schedule:  '0 16 * * 5',        // Every Friday at 16:00
    timeZone:  'Africa/Harare',     // CAT = UTC+2, no DST
    region:    'us-central1',
    secrets:   [gmailAppPassword],
  },
  async () => {
    const CONFIG_DOC = 'systemConfig/attendanceEmailConfig'

    // --- Bi-weekly gate: skip if fewer than 13 days since last send ---
    const configRef = db.doc(CONFIG_DOC)
    const configSnap = await configRef.get()

    if (configSnap.exists) {
      const lastSent = configSnap.data().lastSentAt?.toDate()
      if (lastSent) {
        const daysSince = (Date.now() - lastSent.getTime()) / 86_400_000
        if (daysSince < 13) {
          console.log(`Bi-weekly gate: skipping — last sent ${daysSince.toFixed(1)} days ago.`)
          return
        }
      }
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'mabhunure@gmail.com',
        pass: gmailAppPassword.value(),
      },
    })

    // --- Build date range: last 10 school days (Mon–Fri) ---
    const schoolDays = getLastNSchoolDays(10)
    const startDate  = schoolDays[schoolDays.length - 1]   // oldest
    const endDate    = schoolDays[0]                        // most recent

    // --- Fetch all students that have a guardian email ---
    const studentsSnap = await db.collection('students').get()
    const students = studentsSnap.docs
      .map(doc => ({ docId: doc.id, ...doc.data() }))
      .filter(s => s.guardianEmail && s.class)

    // --- Fetch attendance records in the date range ---
    const attSnap = await db.collection('attendance')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get()

    // Group attendance sessions by className
    const byClass = {}
    for (const doc of attSnap.docs) {
      const data = doc.data()
      if (!byClass[data.className]) byClass[data.className] = []
      byClass[data.className].push(data)
    }

    let sent = 0
    let failed = 0

    for (const student of students) {
      const classSessions = byClass[student.class] || []

      // Build subject map: subject → { present, total }
      const subjectMap = {}
      for (const session of classSessions) {
        const subj = session.subject
        if (!subjectMap[subj]) subjectMap[subj] = { present: 0, total: 0 }
        subjectMap[subj].total++

        const record = (session.records || []).find(
          r => r.studentId === student.docId || r.reg_number === student.reg_number
        )
        // present only; late and absent both count as absent per school policy
        if (record && record.status === 'present') {
          subjectMap[subj].present++
        }
      }

      const html = buildEmailHtml(student, subjectMap, startDate, endDate)

      try {
        await transporter.sendMail({
          from:    '"Oasis College Attendance" <mabhunure@gmail.com>',
          to:      student.guardianEmail,
          subject: `Attendance Report — ${student.fullName} | ${fmtDate(startDate)} to ${fmtDate(endDate)}`,
          html,
        })
        sent++
      } catch (err) {
        console.error(`Email failed for ${student.reg_number}:`, err.message)
        failed++
      }
    }

    // --- Persist last-sent timestamp ---
    await configRef.set(
      {
        lastSentAt:        admin.firestore.FieldValue.serverTimestamp(),
        lastSentCount:     sent,
        lastFailedCount:   failed,
        lastPeriodStart:   startDate,
        lastPeriodEnd:     endDate,
      },
      { merge: true }
    )

    console.log(`Attendance report complete: ${sent} sent, ${failed} failed.`)
  }
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the last n Mon–Fri dates as YYYY-MM-DD strings, newest first. */
function getLastNSchoolDays(n) {
  const days = []
  const d = new Date()
  while (days.length < n) {
    d.setDate(d.getDate() - 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) {
      days.push(d.toISOString().split('T')[0])
    }
  }
  return days
}

/** Formats YYYY-MM-DD → "19 Jun 2026" */
function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

/** Builds the HTML email body for one student. */
function buildEmailHtml(student, subjectMap, startDate, endDate) {
  const entries = Object.entries(subjectMap).sort(([a], [b]) => a.localeCompare(b))

  const rows = entries.map(([subject, { present, total }]) => {
    const absent = total - present
    let bg = '#f0fdf4'
    if (total === 0)                    bg = '#f9fafb'
    else if (present === 0)             bg = '#fef2f2'
    else if (present / total < 0.7)     bg = '#fffbeb'

    return `
      <tr>
        <td style="padding:10px 14px;border:1px solid #e5e7eb;background:${bg}">${subject}</td>
        <td style="padding:10px 14px;border:1px solid #e5e7eb;text-align:center;background:${bg};color:#15803d;font-weight:600">${present}</td>
        <td style="padding:10px 14px;border:1px solid #e5e7eb;text-align:center;background:${bg};color:${absent > 0 ? '#dc2626' : '#6b7280'};font-weight:${absent > 0 ? '600' : '400'}">${absent}</td>
        <td style="padding:10px 14px;border:1px solid #e5e7eb;text-align:center;background:${bg}">${total}</td>
      </tr>`
  }).join('')

  const totalPresent  = entries.reduce((s, [, v]) => s + v.present, 0)
  const totalSessions = entries.reduce((s, [, v]) => s + v.total,   0)
  const totalAbsent   = totalSessions - totalPresent
  const pct           = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0
  const pctColor      = pct >= 80 ? '#15803d' : pct >= 60 ? '#d97706' : '#dc2626'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#1e3a5f;padding:28px 32px;text-align:center">
      <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:0.5px">Oasis Private College</h1>
      <p style="color:#93c5fd;margin:6px 0 0;font-size:14px">Bi-Weekly Student Attendance Report</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px">
      <p style="margin:0 0 6px;color:#374151;font-size:15px">
        Dear <strong>${student.guardianName || 'Parent / Guardian'}</strong>,
      </p>
      <p style="margin:0 0 20px;color:#374151;font-size:15px">
        Please find below the attendance summary for your child
        <strong>${student.fullName}</strong> (${student.reg_number}),
        Class: <strong>${student.class}</strong>.
      </p>

      <!-- Period badge -->
      <div style="background:#eff6ff;border-left:4px solid #1e3a5f;padding:12px 16px;margin-bottom:20px;border-radius:0 6px 6px 0">
        <p style="margin:0;font-size:13px;color:#1e3a5f">
          <strong>Report Period:</strong>&nbsp;${fmtDate(startDate)} — ${fmtDate(endDate)}&nbsp;(10 school days)
        </p>
      </div>

      <!-- Attendance table -->
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#1e3a5f">
            <th style="padding:12px 14px;text-align:left;color:#fff;border:1px solid #1e3a5f">Subject</th>
            <th style="padding:12px 14px;text-align:center;color:#fff;border:1px solid #1e3a5f">Days Present</th>
            <th style="padding:12px 14px;text-align:center;color:#fff;border:1px solid #1e3a5f">Days Absent</th>
            <th style="padding:12px 14px;text-align:center;color:#fff;border:1px solid #1e3a5f">Total Sessions</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;border:1px solid #e5e7eb">No attendance records found for this period.</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background:#f9fafb">
            <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:700">Total</td>
            <td style="padding:10px 14px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:#15803d">${totalPresent}</td>
            <td style="padding:10px 14px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:${totalAbsent > 0 ? '#dc2626' : '#6b7280'}">${totalAbsent}</td>
            <td style="padding:10px 14px;border:1px solid #e5e7eb;text-align:center;font-weight:700">${totalSessions}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Overall rate -->
      <div style="margin-top:16px;padding:14px 20px;background:#f9fafb;border-radius:6px;text-align:center">
        <p style="margin:0;font-size:14px;color:#374151">
          Overall Attendance Rate:&nbsp;
          <strong style="color:${pctColor};font-size:20px">${pct}%</strong>
        </p>
      </div>

      <p style="margin-top:24px;font-size:13px;color:#6b7280;line-height:1.6">
        If you have any questions or concerns about your child's attendance,
        please contact the school administration directly.<br><br>
        <strong>Oasis Private College</strong><br>Checheche, Zimbabwe
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:14px 32px;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        This is an automated report generated every two weeks. Please do not reply to this email.
      </p>
    </div>

  </div>
</body>
</html>`
}
