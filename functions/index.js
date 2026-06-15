const { onCall, HttpsError } = require('firebase-functions/v2/https')
const admin  = require('firebase-admin')
const crypto = require('crypto')

admin.initializeApp()
const db   = admin.firestore()
const fbAuth = admin.auth()

/**
 * Verifies a student's password server-side and returns a Firebase custom token
 * whose UID matches the student's Firestore users/{uid} document ID.
 * This enables the client to call signInWithCustomToken so that activeSessions
 * can be secured with `request.auth.uid == uid` in Firestore rules.
 */
exports.verifyStudentPassword = onCall({ region: 'us-central1' }, async (request) => {
  const { regNumber, password } = request.data ?? {}

  if (!regNumber || !password) {
    throw new HttpsError('invalid-argument', 'regNumber and password are required.')
  }

  // 1. Resolve reg_number → students collection doc ID
  const studentSnap = await db.collection('students')
    .where('reg_number', '==', regNumber)
    .limit(1)
    .get()

  const studentDoc   = studentSnap.empty ? null : studentSnap.docs[0]
  const studentDocId = studentDoc?.id ?? null
  const studentData  = studentDoc?.data() ?? {}

  // 2. Find the users collection record
  const userSnap = await db.collection('users')
    .where('studentId',        '==', studentDocId ?? regNumber)
    .where('role',             '==', 'student')
    .where('hasSetupPassword', '==', true)
    .limit(1)
    .get()

  if (userSnap.empty) {
    throw new HttpsError('not-found', 'No account found. Use "First time (OTP)" if this is your first login.')
  }

  const userDoc  = userSnap.docs[0]
  const userData = userDoc.data()
  const uid      = userDoc.id

  // 3. Verify password — SHA-256 first, then legacy MD5
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex')
  const md5Hash    = crypto.createHash('md5').update(password).digest('hex')

  if (sha256Hash !== userData.password) {
    if (md5Hash !== userData.password) {
      throw new HttpsError('unauthenticated', 'Invalid credentials.')
    }
    // Upgrade MD5 → SHA-256 server-side (no longer needs client-side unauthenticated write)
    await userDoc.ref.update({ password: sha256Hash }).catch(() => {})
  }

  // 4. Ensure Firebase Auth user exists with UID matching the Firestore doc ID
  //    This is what makes `request.auth.uid == uid` work in security rules.
  try {
    await fbAuth.getUser(uid)
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      await fbAuth.createUser({ uid })
    } else {
      throw new HttpsError('internal', 'Failed to initialise auth for this account.')
    }
  }

  // 5. Mint custom token
  const customToken = await fbAuth.createCustomToken(uid)

  // 6. Return token + session data so client needs zero extra Firestore reads
  return {
    customToken,
    sessionData: {
      uid,
      studentId:     regNumber,
      studentDocId:  studentDoc?.id ?? null,
      hasSetupPassword: true,
      name:          studentData.fullName        || userData.name            || '',
      class:         studentData.class           || '',
      dateOfBirth:   studentData.dateOfBirth     || '',
      guardianName:  studentData.guardianName    || studentData.parentName   || '',
      guardianPhone: studentData.guardianPhone   || studentData.parentPhone  || '',
      guardianEmail: studentData.guardianEmail   || studentData.parentEmail  || '',
      email:         studentData.email           || studentData.studentEmail || '',
      phone:         studentData.phone           || '',
      hasEmail:      studentData.hasEmail        ?? (!!studentData.email || !!studentData.studentEmail),
      regNumber:     studentData.reg_number      || regNumber,
    },
  }
})
