# Oasis Private College — Functionality Issues Report

**Generated:** 2026-06-17  
**Audited by:** Deep static analysis (68 files read)  
**Total issues found:** 58  
**Last updated:** 2026-06-17 (active fix session)

---

## Summary

| Severity | Total | ✅ Fixed | ⏸️ Deferred | Remaining |
|----------|-------|---------|------------|-----------|
| 🔴 CRITICAL | 11 | 8 | 1 | 2 |
| 🟠 HIGH | 13 | 13 | 0 | 0 |
| 🟡 MEDIUM | 19 | 4 | 0 | 15 |
| 🔵 LOW | 15 | 4 | 0 | 11 |
| **Total** | **58** | **29** | **1** | **28** |

---

## 🔴 CRITICAL

---

### C-01 — Hardcoded expense term ("Term 2") in RecordExpense

**File:** `src/pages/bursar/RecordExpense.jsx` lines 56, 72

Both the `expenses` and `financialLogs` documents are written with `term: 'Term 2'` as a string literal regardless of the active portal term. Expenses recorded in Term 1 or Term 3 are permanently attributed to the wrong term, corrupting the income statement, budget overview, and all term-filtered financial reports.

**Fix:** Read the current term from `portalSettings.main` the same way `ReceivePayment.jsx` does, and format it consistently.

---

### C-02 ✅ FIXED — End-of-term procedure stamps hardcoded admin email as `closedBy`

**File:** `src/pages/EndOfTerm.jsx` line 91

```js
runEndOfTermProcedure(closingTerm, openingTerm, 'admin@oasis.edu', handleProgressUpdate)
```

The `closedBy` field written to every `feeAccount` document and the audit trail permanently misattributes a fictional email address. Financial records will never reflect who actually ran the procedure.

**Fix:** Pass the actual logged-in user's email from `sessionStorage.getItem('studentsAdminSession')` or the `adminSession` key.

---

### C-03 ✅ FIXED — End-of-term completion screen shows stale preflight totals

**File:** `src/pages/EndOfTerm.jsx` lines 93–96

After the procedure succeeds, `result?.arrearsTotal` is read from the preflight snapshot (taken before the run). If accounts changed between preflight and execution, the screen displays wrong totals. The procedure's own return value contains the correct post-run totals but they are ignored.

**Fix:** Use the return value from `runEndOfTermProcedure` to populate the completion screen.

---

### C-04 ✅ FIXED — Term number becomes `NaN` when `portalSettings.currentTerm` is stored as "Term 2"

**File:** `src/pages/EndOfTerm.jsx` line 43 (also affects `Arrears.jsx` line 18)

`Number("Term 2")` is `NaN`. The `closing.number` becomes `NaN`, `nextTerm()` returns `{ number: NaN, year }`, and the end-of-term run writes `"NaN-NaN"` termIds to Firestore, querying and writing nonsense documents. Additionally, `Arrears.jsx` formats termId as `"2-2025"` while `runEndOfTermProcedure` may have written accounts as `"Term 2-2025"` — causing the arrears query to find zero accounts.

**Fix:** Normalise the `currentTerm` value at the point it is read — strip "Term " prefix before passing to `Number()`. Standardise the termId format across all code paths.

---

### C-05 ✅ FIXED — `initStudentSession` is never called at student login — session guard is permanently disabled

**File:** `src/pages/Login.jsx` — `handleStudentPassword` function (lines 123–199)

When a student logs in with a password, the session is written to `sessionStorage` but `initStudentSession` (from `useStudentSessionGuard.js`) is never called. The `studentSessionId` key is never set, so the concurrent-session kill mechanism and the `lastActiveAt` ping are both completely inactive for all password logins. The school has no protection against students sharing login credentials.

**Fix:** Call `initStudentSession(uid, sessionId)` immediately after writing the session to `sessionStorage` on successful login.

---

### C-06 ⏸️ DEFERRED — MD5 password fallback never upgrades to SHA-256

**File:** `src/utils/hash.js` + `src/pages/Login.jsx` line 174

```js
if (sha256Hash !== userData.password && md5Hash !== userData.password)
```

If the stored hash is MD5, login succeeds but no code ever re-hashes and overwrites with SHA-256. The comment says "Remove once all student passwords have been re-hashed" but the migration never happens automatically. MD5 remains permanent for legacy accounts.

**Fix:** On successful MD5 match, immediately write the SHA-256 hash back to Firestore before completing login.

---

### C-07 ✅ FIXED — `LoginRedirect` sends any Firebase Auth user to `/dashboard` regardless of role

**File:** `src/components/LoginRedirect.jsx` lines 21–23

If a teacher, bursar, or student is Firebase-authenticated (session persists in browser tab), they are redirected to `/dashboard` (the student records admin area) when visiting `/`. A bursar or teacher landing in the admin area is a privilege escalation path.

**Fix:** Check `sessionStorage` for the correct portal key (`teacherSession`, `bursarSession`, `studentSession`) and redirect to the appropriate portal URL.

---

### C-08 — Student results query uses client clock to compute current term, ignoring portal settings

**File:** `src/pages/student/StudentResults.jsx` lines 73–76; `src/pages/Exams.jsx` lines 19–20

`getCurrentTerm()` computes the term number from the wall-clock month, not from `portalSettings.currentTerm`. If the school is in Term 2 but the calendar month maps to Term 1, results queries target the wrong term entirely. Portal settings exist to decouple the school calendar from the civil calendar.

**Fix:** Read the current term from `portalSettings` (same as the StudentDashboard and ReceivePayment already do).

---

### C-09 ✅ FIXED — Clearance fee check reads `arrears` field but end-of-term procedure writes `balanceBD`

**File:** `src/pages/student/ClearanceApplicationForm.jsx` lines 83–99

The check computes `totalOwed = max(0, termFees - totalPaid) + arrears`. The end-of-term procedure (`runEndOfTermProcedure`) stores the carried-forward balance as `balanceBD`, not `arrears`. If `arrears` is not explicitly populated by a separate code path, this check silently ignores historical debt and issues clearance certificates prematurely.

**Fix:** Change the fee check to read `balanceBD` (or normalise both field names to one standard).

---

### C-10 ✅ FIXED — `generateRegNumber` fallback produces only 1,000 unique values — guaranteed collision

**File:** `src/utils/generateRegNumber.js` lines 13–16

After 20 failed attempts, the fallback is `R${year}${String(Date.now()).slice(-3)}` — only 1,000 possible values. In a school with > 1,000 students the fallback always collides. Even the main scheme (4-digit random suffix = 10,000 values) is too small for cumulative students over years.

**Fix:** Use a Firestore atomic counter document for reg number generation, or use a UUID-based scheme.

---

### C-11 ✅ FIXED — Proof-of-payment approval does not update the student's fee account

**File:** `src/pages/bursar/ReviewPOP.jsx` lines 47–57

Approving a POP only sets `proofOfPayments/{id}.status = 'approved'`. It does not credit `feeAccounts` (`totalPaid`, `balance`, `payments` array). The student's fee balance never decreases. The student sees their proof marked "approved" but their balance and results-access threshold remain unchanged. There is no link between an approved POP and the receipt creation flow in `ReceivePayment`.

**Fix:** On POP approval, either (a) automatically create a receipt and update the fee account, or (b) display a workflow prompt for the bursar to complete the payment in `ReceivePayment` with the POP pre-filled.

---

## 🟠 HIGH

---

### H-01 ✅ FIXED — Payments page doubles "Term" prefix — shows no payments

**File:** `src/pages/Payments.jsx` lines 17–22

```js
const term = `Term ${settingsSnap.data().currentTerm}`
```

If `currentTerm` is stored as `"Term 2"`, this produces `"Term Term 2"` which matches no receipts. The payments page shows empty for the normal case.

**Fix:** Strip any leading "Term " from `currentTerm` before prepending it.

---

### H-02 ✅ FIXED — Arrears term query format mismatches fee account format

**File:** `src/pages/Arrears.jsx` lines 17–19

Arrears builds termId as `"2-2025"` while payments and receipts may use `"Term 2"`. Any mismatch means arrears shows zero even when accounts exist.

**Fix:** Standardise the termId format across all code paths (recommend `"2-2025"` numeric form).

---

### H-03 ✅ FIXED — `SetupPassword.jsx` navigates to dashboard without establishing a session

**File:** `src/pages/student/SetupPassword.jsx` lines 60–62

After setting a password, the page navigates to `/student/dashboard`. But `studentData` in context is read from `sessionStorage.getItem('studentSession')`, which is never written here. `StudentProtectedRoute` finds `studentData = null` and redirects back to `/login`, trapping the student in a loop.

**Fix:** Navigate to `/login` after password setup (matching what `SetPasswordModal` does) so the student logs in fresh and the session is properly established.

---

### H-04 ✅ FIXED — Teacher attendance term constants computed at module load, never updated

**File:** `src/pages/teacher/TeacherAttendance.jsx` lines 8–9 (also `ExeatManagementPage.jsx` line 16, `Exams.jsx` line 19)

Term constants are module-level — evaluated once when the bundle loads and never refreshed. If the school crosses a term boundary while the app is open, queries target the wrong term until a hard-refresh.

**Fix:** Move term computation inside the component using `useState`/`useEffect` with portal settings, or use a shared `useCurrentTerm` hook.

---

### H-05 ✅ FIXED — `TeacherDashboard` session parse on every render — blank page if session is missing

**File:** `src/pages/teacher/TeacherDashboard.jsx` line 13

`JSON.parse(sessionStorage.getItem('teacherSession') || '{}')` runs on every render. If the session is missing or malformed, `session.uid` is undefined and the effect exits silently. The teacher sees a blank page with no error or redirect.

**Fix:** Handle missing session explicitly — redirect to `/staff-login` with an informative message, or let `TeacherProtectedRoute` handle it upstream.

---

### H-06 ✅ FIXED — Receipt number generation has a race condition — duplicate receipt numbers possible

**File:** `src/pages/bursar/ReceivePayment.jsx` lines 30–37

`getNextReceiptNumber()` queries the last receipt, reads its number, and increments by 1. Two concurrent bursar sessions can read the same last receipt and generate the same number. Receipt numbers are financial audit documents and must be unique.

**Fix:** Use a Firestore transaction on a counter document (`config/receiptCounter`) for atomic number generation.

---

### H-07 ✅ FIXED — Secondary Firebase app for teacher creation may be in stale authenticated state

**File:** `src/pages/admin/TeacherAccounts.jsx` lines 16–20

`getSecondaryAuth()` reuses an existing `'teacher-create'` Firebase app if found. If a previous creation attempt failed mid-way, the secondary app is already authenticated and `createUserWithEmailAndPassword` throws unexpected errors (e.g., `auth/email-already-in-use` for an unrelated address).

**Fix:** Always delete and re-initialise the secondary app before teacher creation, or sign out the secondary app before calling `createUserWithEmailAndPassword`.

---

### H-08 ✅ FIXED — Database reset page is accessible to `staff` role

**File:** `src/pages/webadmin/DatabaseReset.jsx` (guarded by `AdminRoute`)

`AdminRoute` allows both `admin` and `staff` roles. The database reset page deletes all student records, financial data, and applications. Staff members should not access this destructive operation — only the `admin` role (or a dedicated `webadmin` role) should.

**Fix:** Add an explicit role check inside `DatabaseReset.jsx` and restrict it to `role === 'admin'`.

---

### H-09 ✅ FIXED — Student fee ledger reads `payments` array but `ReceivePayment` writes to separate collection

**File:** `src/pages/student/StudentFees.jsx` lines 40–52

The ledger is built from `account?.payments || []`. If `ReceivePayment` updates `totalPaid` and `balance` on the fee account but does not also push to the `payments` array, the ledger shows only the opening charge row with no payment history — even though the balance card shows the correct value.

**Fix:** Confirm and enforce that `ReceivePayment` pushes each receipt to `feeAccount.payments` in addition to writing the standalone receipt document, or rebuild the ledger from the `receipts` collection directly.

---

### H-10 ✅ FIXED — Student results clearance check queries `regNo` field after backfill renamed it to `reg_number`

**File:** `src/pages/student/StudentResults.jsx` line 129

```js
where('regNo', '==', studentData.regNumber)
```

`backfillRegNumberFields` in `students.js` renames `regNo` → `reg_number` in `clearancePasses`. After the backfill runs, this query finds nothing and every completing or transferring student is permanently blocked from seeing results even after clearance is issued.

**Fix:** Update the query to use `reg_number` to match the migrated field name.

---

### H-11 ✅ FIXED — Exeat application does not validate dates against term boundaries server-side

**File:** `src/pages/student/ExeatApplicationForm.jsx` lines 72–88

`validate()` only checks that return date ≥ departure date. The HTML `min`/`max` attributes are bypassable via DevTools. A student can submit exeat dates outside the term window.

**Fix:** Add explicit JS validation: check that both dates fall within `termStartDate` and `termEndDate` from `useTermDates`, and reject the form if they don't.

---

### H-12 ✅ FIXED — `Registration.jsx` searches by `registrationId` but students are enrolled with `reg_number`

**File:** `src/pages/Registration.jsx` line 36

```js
s.registrationId?.toLowerCase().includes(search.toLowerCase())
```

The enrolment form stores the registration number as `reg_number`, not `registrationId`. This search field never matches any student. All ID lookups return no results.

**Fix:** Change the search to use `s.reg_number` (or include both fields with `||`).

---

### H-13 ✅ FIXED — `AccessPassPage` placeholder format doesn't match the actual registration number format

**File:** `src/pages/AccessPassPage.jsx` line 54

The placeholder says `"OC-2025-0001"` (student ID format) but the query likely uses `reg_number` (format `"R267906"`). Users entering the wrong format will always get no results with no explanation.

**Fix:** Update the placeholder to show the correct `R-YYYYNNN` format and add a label clarifying which number to enter.

---

## 🟡 MEDIUM

---

### M-01 — Session timeout default mismatch between hook and context

**File:** `src/hooks/useStudentSessionTimeout.js` line 14 vs `src/context/StudentContext.jsx` line 9

The hook falls back to `4` minutes; the context default is `20` minutes. Inconsistent defaults create unpredictable timeout behaviour depending on which code path initialises first.

---

### M-02 — Portal settings allow saving `sessionTimeoutMinutes = 0`, causing instant logouts

**File:** `src/pages/webadmin/PortalSettings.jsx` line 10

The default is 4 minutes and there is no minimum enforcement in the save handler. An admin could save `0` and cause all students to be immediately timed out on every page load.

**Fix:** Add `min="1"` to the input and validate before saving.

---

### M-03 — Student passwords have no complexity requirements

**File:** `src/pages/student/SetupPassword.jsx` line 26; `src/components/auth/SetPasswordModal.jsx` line 26

Only length ≥ 8 is required. Passwords like `"aaaaaaaa"` are accepted on a portal that stores financial data.

**Fix:** Require at least one uppercase letter, one digit, and one special character.

---

### M-04 ✅ FIXED — Student profile phone field pre-populated with guardian's phone number

**File:** `src/pages/student/StudentProfile.jsx` lines 17–18

```js
useState(firestoreStudent?.phone || firestoreStudent?.guardianPhone || ...)
```

If the student has no personal phone set, the guardian's phone is used as the default. Saving without changing it writes the guardian's number as the student's personal phone, corrupting notification routing.

**Fix:** Default to empty string when `firestoreStudent?.phone` is absent; do not fall through to `guardianPhone`.

---

### M-05 — Student dashboard results count query uses `studentId` (likely wrong field)

**File:** `src/pages/student/StudentDashboard.jsx` line 43

```js
where('studentId', '==', studentData.studentId)
```

The session object stores `studentId` as the registration number string. But `academicResults` documents may use a different `studentId` field or the Firestore document ID. The "subjects available" count on the dashboard likely always shows 0.

**Fix:** Verify the correct field name in `academicResults` documents and align the query.

---

### M-06 ✅ FIXED — Rejected clearance application blocks resubmission

**File:** `src/pages/student/ClearanceApplicationForm.jsx` lines 38–42

If a student's clearance application was rejected, `setDone(true)` is still triggered and they see the "Application Submitted" success screen. They cannot resubmit without admin intervention in Firestore.

**Fix:** Only trigger `setDone(true)` when `status === 'pending'` or `status === 'approved'`; show a "Reapply" option for rejected applications.

---

### M-07 — Active exeat check may render `undefined` as status text

**File:** `src/pages/student/ExeatApplicationForm.jsx` lines 52–54

If a Firestore document has no `status` field, `activeExeat.status` is `undefined` and is displayed directly in the blocked screen message.

**Fix:** Add a fallback: `activeExeat.status ?? 'unknown'`.

---

### M-08 — `StudentContext` session data never refreshes during a session

**File:** `src/context/StudentContext.jsx` lines 48–56

Session-based student data is read from `sessionStorage` once on mount. If the admin changes the student's class or fees threshold after login, the student sees stale data for their entire session.

**Fix:** Supplement the session data with the real-time `firestoreStudent` listener fields where critical (class, fee threshold, boarding status).

---

### M-09 — `generateRegNumber` uniqueness check has a race window before insert

**File:** `src/utils/generateRegNumber.js`

The function checks uniqueness with `getDocs` then returns the number for the caller to use in a separate `addDoc`. Two concurrent enrolments can both pass the uniqueness check for the same number.

**Fix:** Use a Firestore transaction that checks and increments a counter atomically.

---

### M-10 ✅ FIXED — Payments page shows empty list with no explanation when term is not configured

**File:** `src/pages/Payments.jsx` lines 22–23

When `currentTerm` is empty, the page silently returns with an empty list. The user sees "No payments recorded yet" with no indication that portal settings need to be configured.

**Fix:** Show a warning banner: "Current term not set — configure it in Portal Settings before viewing payments."

---

### M-11 — Bulk import term list is hardcoded to current auto-computed term

**File:** `src/components/BulkImport.jsx` lines 19–20; `src/pages/Exams.jsx` lines 19–20

Teachers cannot upload results for past terms without a code change. There is no dropdown to select a different term.

**Fix:** Load available terms from Firestore or generate a list of recent terms for the dropdown.

---

### M-12 — `RecordExpense` navigates to `/bursar/budget` which may not be a registered route

**File:** `src/pages/bursar/RecordExpense.jsx` line 78

If `/bursar/budget` is not registered, the navigation after a successful save silently lands on a "not found" page.

**Fix:** Verify the route name — it should likely be `/bursar/budget-overview` — and correct the navigation target.

---

### M-13 — `ReceivePayment` auto-select effect has empty dependency array — does not re-run on URL change

**File:** `src/pages/bursar/ReceivePayment.jsx` lines 67–85

```js
useEffect(() => { ... }, [])
```

If the URL query param (`?reg=...`) changes via navigation, the effect doesn't re-run. The previously loaded student stays selected.

**Fix:** Change the dependency array to `[searchParams]`.

---

### M-14 — OTP is potentially written to the wrong Firestore path

**File:** `src/pages/webadmin/StudentOTPManager.jsx` (cross-referenced with `src/pages/Login.jsx` line 103)

Login reads OTP from `users/{uid}/otpSecret/current` (a subcollection document). If `StudentOTPManager` writes only to a top-level field on the `users` document, login will always fail with "No active OTP found" for freshly generated OTPs.

**Fix:** Confirm and enforce that `StudentOTPManager` writes to `users/{uid}/otpSecret/current` and sets an `expiresAt` field matching what Login expects.

---

### M-15 — Security log records duplicate events for concurrent session kills

**File:** `src/hooks/useStudentSessionGuard.js` line 112

Both the evicting and evicted sessions log `CONCURRENT_SESSION_KILLED` for the same action, creating noise and making the security log harder to interpret.

**Fix:** Log `SESSION_EVICTED` from the side being kicked out and `CONCURRENT_SESSION_DETECTED` from the side initiating the eviction.

---

### M-16 — Session guard snapshot callback may fire after component unmount

**File:** `src/hooks/useStudentSessionGuard.js` lines 95–130

`logout()` and `navigate()` are called inside `onSnapshot`. If the component unmounts before the snapshot fires, React state update warnings may appear.

**Fix:** Add an `isMounted` flag (or use an `AbortController` equivalent) and skip state updates if the component has unmounted.

---

### M-17 ✅ FIXED — `Settings.jsx` plain `setDoc` on `config/schoolSettings` deletes unrelated fields

**File:** `src/pages/Settings.jsx` lines 54–67

The write to `config/schoolSettings` uses `setDoc` without `{ merge: true }`. Any fields stored there by other pages (e.g., `oLevelFeesPerTerm`, `aLevelFeesPerTerm` set via `Fees.jsx`) are silently deleted on each save.

**Fix:** Add `{ merge: true }` to the `setDoc` call on `config/schoolSettings`.

---

### M-18 — Student ID counter does not reset annually

**File:** `src/utils/generateStudentId.js`

The `config/lastStudentId` counter is globally monotonic. In 2026, students get IDs like `OC-2026-0503` (continuing from 2025) rather than `OC-2026-0001`, making the year in the ID misleading.

**Fix:** Store the counter per year (e.g., `config/lastStudentId_2026`) and reset to 0 at the start of each year.

---

### M-19 — `useTermDates` reads from `config/schoolSettings` — silent failure if term dates stored elsewhere

**File:** `src/hooks/useTermDates.js` line 11 vs `src/pages/Settings.jsx` line 54

`useTermDates` reads `termStartDate`/`termEndDate` from `config/schoolSettings`. If a future code path writes them to a different document, `useTermDates` returns empty strings silently, disabling all date validation in exeat and clearance forms.

**Fix:** Add an error/empty state and surface a warning when term dates are missing.

---

## 🔵 LOW

---

### L-01 ✅ FIXED — "Remember me" checkbox on staff login has no effect

**File:** `src/pages/StaffLogin.jsx` lines 409–412

The checkbox is rendered but its state is never read. It should control session persistence (`browserSessionPersistence` vs `browserLocalPersistence`) or be removed.

---

### L-02 ✅ FIXED — "Forgot password?" on staff login has no handler

**File:** `src/pages/StaffLogin.jsx` lines 414–416

Clicking the button does nothing. This blocks locked-out staff from recovering access.

**Fix:** Wire up Firebase `sendPasswordResetEmail` or link to an IT contact.

---

### L-03 — Registration page class filter is hardcoded to 8 specific classes

**File:** `src/pages/Registration.jsx` line 10

Only 8 specific class names are listed. Any class not in this list is invisible in the filter. Should dynamically load from the `classes` collection as `Students.jsx` does.

---

### L-04 ✅ FIXED — Payment modal accepts zero and negative amounts

**File:** `src/components/PaymentModal.jsx`

No `min` attribute and no JS validation on the amount field. Submitting `0` or a negative number is accepted.

**Fix:** Add `min="0.01"` and validate before submission.

---

### L-05 — Grade colour chart assigns same colour to A and B grades

**File:** `src/pages/student/StudentResults.jsx` lines 30–37

Both A and B return `'text-emerald-400'`. On the performance analysis they are indistinguishable.

**Fix:** Assign a distinct colour to each grade level.

---

### L-06 — Teacher attendance period matching uses name string instead of UID

**File:** `src/pages/teacher/TeacherDashboard.jsx` lines 41–43

```js
if (!p.teacher || p.teacher === session.name)
```

Name string matching is fragile — typos or capitalisation differences cause periods to be missed. Comparing by `session.uid` is more reliable.

---

### L-07 — Plain date strings parsed as UTC — may show wrong day in some timezones

**File:** `src/hooks/useTermDates.js` line 27

`new Date("2025-05-01")` is UTC midnight. In UTC+2 (Zimbabwe) this is fine, but the pattern is brittle. Use `new Date("2025-05-01T00:00:00")` (local time interpretation) for consistency.

---

### L-08 — Firebase config API key committed to version control

**File:** `src/firebase/config.js` lines 9–16

The full Firebase client config including `apiKey` is hardcoded in a tracked file. While client-side Firebase keys are "public" by nature, best practice is to move them to `.env` variables (matching the `VITE_EMAILJS_*` pattern used elsewhere) to support different environments and reduce key exposure in git history.

---

### L-09 — `logSecurityEvent` spread order allows caller data to overwrite system fields

**File:** `src/utils/logSecurityEvent.js` lines 10–19

```js
await addDoc(collection(db, 'securityLogs'), {
  uid: data.uid ?? null,
  ...data,   // can overwrite uid, action, and timestamp
})
```

The `...data` spread after explicit fields means a caller passing `{ timestamp: clientDate }` will override `serverTimestamp()`. The spread should come first, with system-set fields after.

---

### L-10 — Bulk import `NON_SUBJECT` list missing `fullname` — may misclassify the name column as a subject

**File:** `src/components/BulkImport.jsx` lines 52–56

`NON_SUBJECT` contains `['regno', 'name', 'comment']` but not `'fullname'`. If the Excel template uses a `fullName` column (normalised to `fullname`), it may be treated as a subject column and a bogus `fullname` subject row created in results.

**Fix:** Add `'fullname'` to the `NON_SUBJECT` list.

---

### L-11 ✅ FIXED — `StudentLayout` never calls `useStudentSessionGuard`

**File:** `src/pages/student/StudentLayout.jsx`

`useStudentSessionTimeout` is called but `useStudentSessionGuard` is not. The concurrent-session detection is completely inactive regardless of whether login sets the session ID correctly (related to C-05 but independently broken).

**Fix:** Call `useStudentSessionGuard(studentData?.uid)` inside `StudentLayout`.

---

### L-12 — Staff load errors swallowed silently in `useStaff`

**File:** `src/hooks/useStaff.js` line 20

`.catch(err => console.error(...))` — if the staff collection is unreadable, the public Staff page shows an empty list with no user-facing message.

**Fix:** Return an `error` state from the hook and display a fallback message in the Staff page.

---

### L-13 — End-of-term checkboxes ("Generate closing statements", "Notify student portal") do nothing

**File:** `src/pages/EndOfTerm.jsx` lines 198–205

Both checkboxes are `defaultChecked` but their state is never used in `handleRunProcedure`. The procedure runs identically regardless.

**Fix:** Either wire them up to conditional steps in the procedure or remove them to avoid misleading the user.

---

### L-14 — End-of-term completion uses `window.location.reload()` instead of React navigation

**File:** `src/pages/EndOfTerm.jsx` line 126

A hard reload is unnecessary and discards React Router history state.

**Fix:** Reset component state and re-run `runPreflight()` instead.

---

### L-15 — Student pass threshold hardcoded at 50% instead of reading from grade settings

**File:** `src/pages/student/StudentResults.jsx` lines 263, 266

```js
subjectList.filter(r => r.mark >= 50)
```

Pass mark is hardcoded. If the school's O-Level pass boundary changes, the performance analysis shows wrong pass/fail counts even though the grade table would display the correct grade.

**Fix:** Load the pass mark from `gradeSettings` in Firestore and use it in the filter.

---

## Recommended Fix Priority

1. **Fix C-04 first** — the term NaN bug breaks end-of-term, arrears, and any term-aware query.
2. **Fix C-11** — POP approval not updating fee accounts is a core financial workflow failure.
3. **Fix C-07** — LoginRedirect privilege escalation.
4. **Fix H-01 and H-02** — Payments and arrears showing empty due to term string mismatch.
5. **Fix H-03** — SetupPassword login loop.
6. **Fix C-02** — Correct the hardcoded admin email before any end-of-term runs.
7. **Fix M-17** — Settings page silently deleting fee configuration on save.
