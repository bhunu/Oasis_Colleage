# Oasis Private College — System Audit Report
**Date:** 11 June 2026  
**Auditor:** Claude Code (Automated)  
**Scope:** Full codebase — security, data integrity, system flow, logic, UX gaps

---

## Severity Legend
| Level | Meaning |
|---|---|
| 🔴 CRITICAL | Immediate risk — data breach, financial manipulation, or authentication bypass possible |
| 🟠 HIGH | Serious vulnerability or data integrity risk — fix before next release |
| 🟡 MEDIUM | Functional or security gap — fix in current sprint |
| 🟢 LOW | Minor issue or improvement — fix when convenient |

---

## Status Legend
| Status | Meaning |
|---|---|
| ⬜ PENDING | Not yet addressed |
| 🔄 IN PROGRESS | Work started |
| ✅ DONE | Fixed and verified |

---

## 🔴 CRITICAL FINDINGS

### C-01 — Hardcoded Admin PIN in Source Code ⬜ PENDING
- **File:** `src/hooks/usePIN.js:3`
- **Issue:** Admin unlock PIN hardcoded as `'2026'` in plain source code. Anyone with repo access can unlock admin features without knowing the PIN.
- **Fix:** Store PIN as a hashed value in Firestore (admin-only collection). Verify server-side, never client-side. Consider replacing with proper Firebase role-based access.

---

### C-02 — MD5 Password Hashing Without Salt ⬜ PENDING
- **File:** `src/utils/hash.js`
- **Issue:** Student portal passwords are hashed with plain MD5 — a broken algorithm with no salt. Rainbow table attacks can crack all student passwords instantly.
- **Fix:** Replace with bcrypt or use Firebase Authentication for student login instead of manual hashing. Migrate all existing hashes on next login.

---

### C-03 — Firestore Rules Allow Unauthenticated Reads of Sensitive Data ⬜ PENDING
- **File:** `firestore.rules` (lines 9, 52–78)
- **Issue:** Multiple collections allow unauthenticated reads:
  - `students` collection: `allow read: if true` — all student personal data (name, DOB, guardian info, home address, phone) readable by anyone without logging in.
  - `proofOfPayments`, `academicResults`, `feeAccounts`, `receipts`: readable if `studentId != null` — no verification the reader owns that ID.
- **Fix:** Require `request.auth != null` for all reads. Students should only read their own documents by matching `request.auth.uid` to stored UID.

---

### C-04 — Client-Side Only Role Validation ⬜ PENDING
- **Files:** `src/components/ProtectedRoute.jsx`, `src/components/admin/AdminRoute.jsx`
- **Issue:** Role checks read from `sessionStorage` which can be edited in the browser. Example: changing `role` from `'Student Admin'` to `'bursar'` in DevTools bypasses all route guards.
- **Fix:** Role must be verified server-side (Firebase Custom Claims or Firestore rules). Client routing guards are only UX — never security.

---

### C-05 — Admin PIN Unlock State Stored in sessionStorage ⬜ PENDING
- **File:** `src/hooks/usePIN.js:8`
- **Issue:** Admin unlock state stored as `sessionStorage.setItem('oasis_admin_unlocked', 'true')`. Any JavaScript can set this value, bypassing the PIN entirely.
- **Fix:** Do not gate admin actions on a client-side flag. Require re-authentication or server-verified PIN for each sensitive admin operation.

---

### C-06 — EmailJS Credentials Exposed ⬜ PENDING
- **File:** `.env` / `src/utils/sendOtpEmail.js`
- **Issue:** EmailJS `SERVICE_ID`, `TEMPLATE_ID`, and `PUBLIC_KEY` are visible in client-side code. Attackers can send emails impersonating the school to any address.
- **Fix:** Rotate credentials immediately. Move email sending to a Firebase Cloud Function or server-side proxy. Never expose email service keys to the client.

---

### C-07 — Firestore Security Rules Allow Open Read/Write on activeSessions ⬜ PENDING
- **File:** `firestore.rules` (lines 105–108)
- **Issue:** `activeSessions` collection: `allow read, write: if true` — completely open. Attacker can read all active sessions (login times, user agents) or delete them to force logouts.
- **Fix:** `allow read, write: if request.auth != null && request.auth.uid == resource.data.uid`

---

### C-08 — Fee Account Created Without studentId on Enrollment ⬜ PENDING
- **File:** `src/pages/Enrol.jsx:208`
- **Issue:** Before recent partial fix, `feeAccounts` documents were created without a `studentId` field, causing fee lookups to fail silently. Existing accounts in Firestore for all pre-fix students are still missing this field.
- **Fix:** Run a one-time Firestore migration to backfill `studentId` (set to `reg_number`) on all `feeAccounts` documents that are missing it. Add this to the `backfillStudentCategories` admin utility.

---

### C-09 — No Upper-Limit Validation on Payment Amount ⬜ PENDING
- **File:** `src/pages/bursar/ReceivePayment.jsx:108`
- **Issue:** Only checks `amount > 0`. No ceiling against actual fee owed. A bursar could record a $100,000 payment on an $800 account, inflating financial reports and creating large credit balances.
- **Fix:** Validate `amount <= (account.termFees - account.totalPaid + small_tolerance)`. Show warning if amount exceeds balance.

---

### C-10 — Weak Randomness for Clearance Pass Serials ⬜ PENDING
- **Files:** `src/pages/ClearanceManagementPage.jsx:32`, `src/components/StudentAccessPass.jsx:12`
- **Issue:** Both clearance passes and exeat passes use `Math.random()` to generate serial numbers. `Math.random()` is not cryptographically secure — serials can be predicted or brute-forced.
- **Fix:** Replace with `crypto.getRandomValues()`:
  ```js
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  const serial = Array.from(arr, b => CHARS[b % CHARS.length]).join('')
  ```

---

### C-11 — Student Personal Data Exposed via Public Fee Verification Page ⬜ PENDING
- **File:** `src/pages/VerifyBalancePage.jsx:20`
- **Issue:** Public page reads student fee balance and name from Firestore using only `reg_number` in the URL. Anyone can enumerate student balances by guessing `R` + 6-digit numbers. Exposes which students are in arrears.
- **Fix:** Add authentication requirement, or restrict to showing only a summary without student name. Rate-limit lookups via Firestore rules or Cloud Function.

---

## 🟠 HIGH FINDINGS

### H-01 — Inconsistent Student Identifier Fields Across Collections ⬜ PENDING
- **Files:** Multiple
- **Issue:** The same student is referenced with different field names in different collections, causing silent lookup failures:
  | Collection | Field Used |
  |---|---|
  | `students` | `reg_number` |
  | `users` | `studentId` (= Firestore doc ID) |
  | `feeAccounts` | both `reg_number` and `studentId` (inconsistent) |
  | `receipts` | `regNumber` (camelCase, different from `reg_number`) |
  | `proofOfPayments` | `studentId` |
  | `exeatApplications` | `studentId` |
- **Fix:** Standardise on `reg_number` (snake_case) as the primary student identifier across ALL collections. Update all queries. Run migration to rename fields on existing documents.

---

### H-02 — OTP Generation Has No Rate Limiting ⬜ PENDING
- **File:** `src/pages/webadmin/StudentOTPManager.jsx:106`
- **Issue:** Admin can generate unlimited OTPs for any student with no cooldown. No audit log records who generated which OTP. A compromised admin account can spam OTPs or overwrite a student's valid OTP.
- **Fix:** Enforce a minimum gap between OTP generations per student (e.g., 60 minutes). Log all OTP generations with admin's identity and timestamp. Move OTP generation to a Cloud Function.

---

### H-03 — Login Attempt Lockout Uses Case-Sensitive Key ⬜ PENDING
- **File:** `src/utils/loginSecurity.js:10`
- **Issue:** `attemptDocId()` lowercases the identifier, but student reg numbers are uppercase (`R262681`). The lockout document key becomes `r262681`, so when checking lockout status with the original casing the lookup misses and lockout never triggers correctly.
- **Fix:** Normalise to uppercase consistently: `identifier.toUpperCase().replace(...)` — or normalise the reg number on input before any comparison.

---

### H-04 — `activeSessions` Race Condition on Session Limit ⬜ PENDING
- **File:** `src/hooks/useStudentSessionGuard.js:23`
- **Issue:** Session count checked and session added in separate operations. If two devices log in simultaneously, both can read `size < MAX_SESSIONS` and both add sessions, exceeding the limit.
- **Fix:** Use a Firestore transaction or batch write that reads and updates atomically.

---

### H-05 — `backfillStudentCategories()` Never Called ⬜ PENDING
- **File:** `src/firebase/students.js:26`
- **Issue:** The `backfillStudentCategories()` function exists but is never triggered from any UI or startup. All students enrolled before the `student_category` field was introduced (including existing A-level students) have no category, causing fee application to silently default them to O Level fees.
- **Fix:** Add a one-click "Run Backfill" button in BursarSettings or WebAdmin. Run it once and confirm count of records updated.

---

### H-06 — No File Type Validation in Firebase Storage Rules ⬜ PENDING
- **File:** `storage.rules`
- **Issue:** Storage rules allow any file type to be uploaded to `proofOfPayments/` and `expenses/receipts/`. No MIME type or extension check.
- **Fix:** Add `request.resource.contentType.matches('image/.*') || request.resource.contentType == 'application/pdf'` to storage rules.

---

### H-07 — Student Password Setup Has No OTP Expiry Check ⬜ PENDING
- **File:** `src/pages/student/SetupPassword.jsx:32`
- **Issue:** On first password setup, code queries `where('hasSetupPassword', '==', false)` but does not verify the OTP is still valid (not expired). Expired OTP sessions can still set passwords.
- **Fix:** Check `otpExpiresAt > now` before allowing password change. Invalidate OTP immediately after use.

---

### H-08 — Clearance Pass — No Uniqueness Check Before Save ⬜ PENDING
- **File:** `src/pages/ClearanceManagementPage.jsx:128`
- **Issue:** Clearance pass saved as `setDoc(doc(db, 'clearancePasses', serial), ...)`. If serial collision occurs (unlikely but possible), an existing clearance pass is silently overwritten.
- **Fix:** Use `getDoc` to verify serial doesn't exist before writing. Or use Firestore `create` permission instead of `set` to fail on collision.

---

### H-09 — Financial Data Accessible with No Transaction-Level Audit Trail ⬜ PENDING
- **Files:** `src/pages/bursar/ReceivePayment.jsx`, `src/pages/Fees.jsx`
- **Issue:** Payments are recorded in `receipts` but fee account updates (to `feeAccounts`) don't log who made the change or when. A bursar can modify payment history with no audit trail.
- **Fix:** Add `updatedBy` and `updatedAt` fields to every `feeAccounts` write. Consider an immutable `feeAccountLedger` sub-collection for all changes.

---

### H-10 — End-of-Term Page Shows Mock/Hardcoded Data ⬜ PENDING
- **File:** `src/pages/EndOfTerm.jsx:9`
- **Issue:** `const mockSummary = { ... }` — hardcoded summary figures are displayed to admins as if real. Admins cannot tell the procedure actually ran or what the real numbers are.
- **Fix:** Either remove the page until fully implemented, or replace mock data with a real Firestore fetch.

---

### H-11 — Portal Settings Not Validated on Load ⬜ PENDING
- **File:** `src/context/StudentContext.jsx:24`
- **Issue:** `portalSettings` loaded from Firestore with no validation. If `resultsAccessThreshold` is set to `200` (e.g., typo) no student can ever access results. If `sessionTimeoutMinutes` is `0` or negative, session management breaks.
- **Fix:** Add validation: `threshold = Math.max(0, Math.min(100, threshold))`, `timeout = Math.max(5, timeout)`, etc.

---

## 🟡 MEDIUM FINDINGS

### M-01 — OCR Amount Has No User Confirmation Step ⬜ PENDING
- **File:** `src/pages/student/StudentUploadPOP.jsx`
- **Issue:** Amount auto-detected from receipt via OCR is read-only with no way to correct it if wrong. A misread ($25 instead of $250) gets submitted silently.
- **Fix:** Make the amount field editable even when OCR detects a value. Show a note: "Auto-detected — please verify before submitting."

---

### M-02 — Coursework Marks — No Min/Max Bounds Validation ⬜ PENDING
- **File:** `src/pages/Coursework.jsx`
- **Issue:** Mark inputs have no enforced upper or lower bound. Values like `-10` or `150` can be saved to Firestore and will display as valid grades.
- **Fix:** Clamp input to `0–100`. Show inline error if out of range. Validate in the `handleSave` function before writing.

---

### M-03 — Fees Threshold Comparison Uses Raw Float ⬜ PENDING
- **File:** `src/pages/student/StudentResults.jsx:144`
- **Issue:** `paidPct = (totalPaid / termFees) * 100` compared directly against integer threshold. Floating-point precision (e.g., `74.99999999`) can cause a student who has paid enough to still see results locked.
- **Fix:** `const paidPct = Math.floor((totalPaid / termFees) * 100)` or compare as cents: `totalPaid * 100 >= termFees * threshold`.

---

### M-04 — Registration Number Format Not Validated on Input ⬜ PENDING
- **File:** `src/pages/Login.jsx:63`
- **Issue:** `const regTerm = /^\d+$/.test(term) ? 'R' + term : term.toUpperCase()` — auto-prepends `R` only for all-digit inputs. Users entering `r262681` (lowercase) get `R262681` but `R 262681` (with space) silently fails.
- **Fix:** Strip all spaces and force uppercase before any comparison: `term.trim().toUpperCase().replace(/^([^R])/i, 'R$1')`.

---

### M-05 — Hardcoded Term String in Enrol.jsx ⬜ PENDING
- **File:** `src/pages/Enrol.jsx:212`
- **Issue:** `term: '2-2025'` hardcoded on every new `feeAccount`. When term changes to Term 1 2027, all newly enrolled students will still have their fee account tagged `2-2025`.
- **Fix:** Read current term from `portalSettings` (same as the bursar settings page does) and use it here.

---

### M-06 — Hardcoded Term String in ReceivePayment.jsx ⬜ PENDING
- **File:** `src/pages/bursar/ReceivePayment.jsx:146`
- **Issue:** `term: 'Term 2'` hardcoded in every receipt. Receipts issued in Term 1 2027 will still say "Term 2".
- **Fix:** Read current term from `portalSettings` or `schoolSettings`.

---

### M-07 — SCHOOL_ID Hardcoded in Multiple Pages ⬜ PENDING
- **Files:** `src/pages/student/StudentResults.jsx:10`, `src/pages/Exams.jsx:16`
- **Issue:** `const SCHOOL_ID = 'oasis'` hardcoded. If Firestore path ever changes or multi-school support is added, this breaks silently.
- **Fix:** Move to a central config constant or `portalSettings` document.

---

### M-08 — No Confirmation Email After Student Enrollment ⬜ PENDING
- **File:** `src/pages/Enrol.jsx`
- **Issue:** After enrollment, OTP email sending failure is caught but the enrollment still shows as successful. Student may never receive their login OTP.
- **Fix:** Show explicit OTP send status. If email fails, display the OTP on-screen or offer a retry. Mark the student as `otpEmailFailed: true` for admin follow-up.

---

### M-09 — No Null Guard on `studentData.class` in Results Page ⬜ PENDING
- **File:** `src/pages/student/StudentResults.jsx:243`
- **Issue:** `const isALevel = /^(Lower|Upper)\s*6/i.test(studentData?.class || '')` — if `class` field is missing from the student document, the student is incorrectly treated as O Level and shown O Level grade tables.
- **Fix:** Fetch `class` from the Firestore student document directly if `studentData.class` is missing from the session.

---

### M-10 — Proof of Payment Reviewer Has No Way to Reject with Reason ⬜ PENDING
- **File:** `src/pages/bursar/` (POP review page)
- **Issue:** The bursar can approve or reject a proof of payment, but there is no field to send a rejection reason to the student. Student sees "rejected" with no explanation.
- **Fix:** Add a `rejectionReason` field on reject action. Surface this in the student's portal under their uploaded POP.

---

### M-11 — Balance Sheet "Cash at Bank" Includes Uncollected Arrears ⬜ PENDING
- **File:** `src/pages/bursar/BursarDashboard.jsx`
- **Issue:** `assets.cash = stats.collected` (sum of `totalPaid` from feeAccounts). This is correct. However `assets.receivables = stats.arrears` double-counts: total assets = collected + arrears, but arrears has NOT been received yet — it's money owed, not money in hand. The balance sheet total is inflated.
- **Fix:** `Total Assets = cash (collected) + receivables (arrears)` is standard accounting practice (receivables ARE assets). However the label should be "Cash in hand" not "Fees collected" since collected includes amounts already spent on expenses.

---

### M-12 — Exeat Application — No Check if Student Already Has Active Exeat ⬜ PENDING
- **File:** `src/pages/student/ExeatApplicationForm.jsx`
- **Issue:** Student can submit multiple concurrent exeat applications. Admin has no automatic flag for duplicates.
- **Fix:** Query for existing `status: 'pending'` or `status: 'approved'` exeats for the student before allowing new submission.

---

## 🟢 LOW FINDINGS

### L-01 — `console.error()` in Production Leaks Internal Structure ⬜ PENDING
- **Files:** Multiple pages
- **Issue:** Raw `console.error(err)` calls expose Firestore collection names, field names, and query structure in browser DevTools — useful for an attacker doing reconnaissance.
- **Fix:** In production build, replace `console.error` with a structured error logger that suppresses raw Firestore errors.

---

### L-02 — Session Timeout Doesn't Distinguish Tabs ⬜ PENDING
- **File:** `src/hooks/useStudentSessionTimeout.js`
- **Issue:** Activity in any browser tab (even unrelated ones) resets the inactivity timer because event listeners are on `window`. Student could leave the portal open indefinitely by having activity in another tab.
- **Fix:** Track inactivity per-tab, or use a `visibilitychange` event to pause timer when tab is hidden.

---

### L-03 — No Confirmation Before Deleting a Student ⬜ PENDING
- **Files:** Student management pages
- **Issue:** Some delete actions use `window.confirm()` but it's inconsistent. Critical deletes (student record, fee account) should have a typed-confirmation dialog.
- **Fix:** Require typing the student's name or reg number to confirm deletion of any student record.

---

### L-04 — Security Event Logs Include Full URL with Query Params ⬜ PENDING
- **File:** `src/utils/logSecurityEvent.js:10`
- **Issue:** `window.location.href` logged in security events. URLs may contain sensitive query parameters (e.g., `?studentId=abc123`).
- **Fix:** Log only `window.location.pathname`, stripping query string.

---

### L-05 — VerifyBalancePage Shows "As of today" Without Last-Updated Timestamp ⬜ PENDING
- **File:** `src/pages/VerifyBalancePage.jsx`
- **Issue:** Balance shown as current but no indication of when the fee account was last updated. A receipt issued this morning might not reflect payment processed yesterday.
- **Fix:** Show `feeAccount.updatedAt` (add this field to all feeAccount writes) on the verification page.

---

### L-06 — No Loading Skeleton on Student Dashboard ⬜ PENDING
- **File:** `src/pages/student/StudentDashboard.jsx`
- **Issue:** While fee account and results data load, the dashboard shows `$0.00` and `0%` which can be alarming to students thinking their fees aren't recorded.
- **Fix:** Show skeleton loaders or a spinner until all data resolves.

---

## Summary

| Severity | Count | Status |
|---|---|---|
| 🔴 Critical | 11 | 0 done |
| 🟠 High | 11 | 0 done |
| 🟡 Medium | 12 | 0 done |
| 🟢 Low | 6 | 0 done |
| **Total** | **40** | **0 / 40 done** |

---

## Recommended Fix Order

1. **C-02** — Replace MD5 with proper password hashing
2. **C-03** — Lock down Firestore rules to authenticated reads only
3. **C-06** — Rotate and hide EmailJS credentials
4. **C-01 + C-05** — Remove hardcoded PIN; replace with server-side check
5. **C-04** — Move role validation server-side (Firebase Custom Claims)
6. **H-01** — Standardise student identifier fields across all collections
7. **C-08** — Run feeAccount backfill migration (add missing `studentId`/`reg_number`)
8. **H-05** — Run `backfillStudentCategories()` for existing students
9. **H-03** — Fix login lockout key casing bug
10. **M-05 + M-06** — Remove hardcoded term strings; read from `portalSettings`
