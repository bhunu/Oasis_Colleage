const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin  = require('firebase-admin')
const crypto = require('crypto')

admin.initializeApp()
const db = admin.firestore()

/**
 * Verifies a student's reg number + password and returns session data.
 * Password is never sent back to the client — only a success response.
 */
exports.verifyStudentPassword = onCall({ region: 'us-central1' }, async (request) => {
  const { regNumber, password } = request.data ?? {}

  if (!regNumber || !password) {
    throw new HttpsError('invalid-argument', 'regNumber and password are required.')
  }

  // 1. Look up the student record for enriched session data
  const studentSnap = await db.collection('students')
    .where('reg_number', '==', regNumber)
    .limit(1)
    .get()

  const studentDoc  = studentSnap.empty ? null : studentSnap.docs[0]
  const studentData = studentDoc?.data() ?? {}

  // 2. Find the users record that has a password set.
  //    Use single-field queries + in-memory filter to avoid composite index requirements.

  let userDoc = null

  // Primary: match by the regNumber field stored at password-setup time
  const byRegSnap = await db.collection('users')
    .where('regNumber', '==', regNumber)
    .limit(5)
    .get()
  userDoc = byRegSnap.docs.find(d => {
    const data = d.data()
    return data.role === 'student' && data.hasSetupPassword === true
  }) ?? null

  // Fallback: match by studentId = Firestore students doc ID (older accounts)
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

  // 3. Verify password — SHA-256 first, then legacy MD5
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex')
  const md5Hash    = crypto.createHash('md5').update(password).digest('hex')

  if (sha256Hash !== userData.password) {
    if (md5Hash !== userData.password) {
      throw new HttpsError('unauthenticated', 'Invalid credentials.')
    }
    // Silently upgrade legacy MD5 hash to SHA-256
    await userDoc.ref.update({ password: sha256Hash }).catch(() => {})
  }

  // 4. Return session data — the client stores this in sessionStorage
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
