# Oasis Private College — Full System Audit Report
**Date:** 2026-06-16  
**Auditor:** Claude Code (automated code-level analysis)  
**Scope:** All five portals — Main Dashboard, Student, Teacher, Bursar, Web Admin

---

## Executive Summary

| Area | Status | Critical Issues |
|---|---|---|
| Routes & Imports | ✅ Mostly OK | `/users` unprotected |
| Auth Guards | ⚠️ Partial | Session guard feature is dead code |
| Navigation / Sidebars | ⚠️ Partial | Bursar sidebar has duplicate entries |
| Firestore Queries | ❌ Multiple bugs | 9 missing composite indexes |
| Firestore Security Rules | ❌ Critical | 12+ collections have no rules |
| Data Flow | ⚠️ Partial | `studentId` always undefined on dashboard |
| Security | ❌ High risk | OTP stored plaintext, loginAttempts open |

---

## 1. Routes Audit

### ✅ All component imports resolve to real files
Every `import` in `src/App.jsx` points to an existing file. Checked all 14 student pages, 5 teacher pages, 14 bursar pages, and all admin routes.

### ❌ Bug — `/users` route is unprotected
**File:** `src/App.jsx` (public routes section)  
The `/users` route renders `<Users />` inside the public section of the app (with `<Navbar>` and `<Footer>`) — it is **not** wrapped in `ProtectedRoute`. This is likely a staff management page and should be protected.

**Fix:** Move `/users` into the `isDashboard` block behind `<ProtectedRoute><Layout>`.

### ⚠️ Note — `StaffPortalSelect.jsx` is untracked
**File:** `src/pages/StaffPortalSelect.jsx`  
The file exists and works, but git shows it as untracked (`??`). It will not be included in commits unless staged.

### ⚠️ Sidebar missing links to registered routes
The following routes are registered in `App.jsx` but have **no sidebar entry** in `src/components/Sidebar.jsx`:

| Route | Page |
|---|---|
| `/registration` | Registration |
| `/fees` | Fees |
| `/arrears` | Arrears |
| `/payments` | Payments |
| `/end-of-term` | EndOfTerm |
| `/student-portal` | StudentPortal |
| `/access-pass` | AccessPassPage |
| `/otp-manager` | StudentOTPManager |

These are only reachable by typing the URL directly. Decide whether they are intentionally hidden or should have sidebar links.

---

## 2. Auth Guards

### ✅ All portals are correctly guarded

| Portal | Guard Component | Mechanism |
|---|---|---|
| Student | `StudentProtectedRoute` | `sessionStorage.studentSession` + context |
| Student (setup) | `StudentAuthRoute` | Redirects setup-complete students |
| Boarder-only pages | `BoarderRoute` | `isBoarder` from Firestore real-time |
| Teacher | `TeacherProtectedRoute` | Firebase Auth + role check + sessionStorage |
| Bursar | `BursarProtectedRoute` | Firebase Auth + role check + sessionStorage |
| Web Admin | `AdminRoute` | Firebase Auth + role check + sessionStorage |
| Main Dashboard | `ProtectedRoute` | Firebase Auth + role check + sessionStorage |

### ❌ Critical Bug — `useStudentSessionGuard` is dead code
**File:** `src/hooks/useStudentSessionGuard.js`  

This hook implements concurrent session killing (max 2 sessions, session pings, `activeSessions` Firestore registry). **None of its three exports are imported anywhere in the codebase:**
- `default useStudentSessionGuard` — never called
- `initStudentSession` — never called
- `endStudentSession` — never called

**Consequence:** Students can have unlimited concurrent sessions. The `activeSessions` Firestore subcollection is never written to. The `PING_INTERVAL_MS` keepalive never fires. The entire security system is non-functional.

**Fix:** Import and call `useStudentSessionGuard` in `StudentLayout.jsx` (alongside the already-working `useStudentSessionTimeout`). Call `initStudentSession` on student login and `endStudentSession` on logout.

### ⚠️ Firestore `activeSessions` rule incompatible with student auth model
**File:** `firestore.rules` (~line 166)  
The `activeSessions` rule requires `request.auth.uid == uid` (Firebase Auth). But the student portal uses **custom sessionStorage** (not Firebase Auth) — students are not signed into Firebase Auth. If `initStudentSession` were ever called, it would fail with a permission error.

**Fix:** Either migrate students to `signInWithCustomToken` (as commented in the rules but never implemented), or change the `activeSessions` rule to allow writes based on a field match instead of Firebase Auth UID.

---

## 3. Navigation / Sidebar Audit

### ✅ Main Dashboard Sidebar — all links work
**File:** `src/components/Sidebar.jsx`  
All 15 nav entries (including the newly added `Exam Timetable`) point to registered routes.

### ✅ Web Admin Sidebar — all links work
**File:** `src/components/admin/Sidebar.jsx`  
All 11 nav entries point to registered `/admin/*` routes.

### ✅ Teacher Layout — all links work
**File:** `src/pages/teacher/TeacherLayout.jsx`  
All 5 nav entries work.

### ✅ Student Layout — all links work
**File:** `src/pages/student/StudentLayout.jsx`  
All conditional nav links (boarder gate, clearance gate) work correctly.

### ❌ Bug — Bursar Sidebar has duplicate nav entries
**File:** `src/components/bursar/BursarSidebar.jsx`  
The NAV array contains two sections that both link to the same routes:
- `student-accounts` appears twice (under "Fee Collections" and "Finance")
- `arrears` appears twice
- `receive-payment` appears twice

The bursar sees three duplicate links in the sidebar. This is a visual/UX bug.

**Fix:** Remove the duplicate section and keep only one group.

---

## 4. Firestore Composite Index Requirements

Firestore **silently fails** (returns empty results with no error visible in the UI) when a query uses `where()` + `orderBy()` on different fields without a composite index. This is the root cause of the notification bug that was just fixed.

### ❌ Missing indexes — queries that will silently return empty results

| Collection | Query | File | Needed Index |
|---|---|---|---|
| `examTimetables` | `where('term') + where('year')` | ExamTimetable.jsx, StudentTimetable.jsx, TeacherTimetable.jsx | `(term ASC, year ASC)` |
| `timetables` | `where('className') + where('term') + where('year')` | AdminTimetable.jsx, TeacherTimetable.jsx | `(className ASC, term ASC, year ASC)` |
| `attendance` | `where('className') + where('date')` | TeacherAttendance.jsx | `(className ASC, date ASC)` |
| `receipts` | `where('reg_number') + orderBy('issuedAt', 'desc')` | StudentDashboard.jsx | `(reg_number ASC, issuedAt DESC)` |
| `notifications` | `where('forStudent') + orderBy('createdAt', 'desc')` | StudentDashboard.jsx | `(forStudent ASC, createdAt DESC)` |
| `proofOfPayments` | `where('reg_number') + orderBy('uploadedAt', 'desc')` | StudentUploadPOP.jsx | `(reg_number ASC, uploadedAt DESC)` |
| `academicResults` | `where('studentId') + orderBy('uploadedAt', 'desc')` | StudentDashboard.jsx | `(studentId ASC, uploadedAt DESC)` |
| `feeAccounts` | `where('balanceType') + orderBy('balance', 'desc')` | ExeatManagementPage.jsx | `(balanceType ASC, balance DESC)` |
| `students` | `where('class') + orderBy('fullName')` | Coursework.jsx | `(class ASC, fullName ASC)` |

> **Note on `examTimetables`:** Two equality `where()` clauses on different fields (`term` and `year`) require a composite index in Firestore production. Works in emulator/small datasets but **will fail in production** without the index.

> **Note on notifications:** `StudentNotifications.jsx` was already fixed (sorts client-side, no longer needs the index). However `StudentDashboard.jsx` still uses the old `orderBy` pattern and will fail.

**Action:** Create all indexes listed above in the Firebase Console → Firestore → Indexes → Composite.

---

## 5. Firestore Security Rules Gaps

### ❌ Critical — 12+ actively-used collections have no security rules

The `firestore.rules` file is missing rules for these collections. In Firestore, **the default is deny-all** — any collection without a matching rule is completely inaccessible. The features relying on these collections will fail silently in production.

| Collection | Used By | Risk if Open | Risk if Blocked |
|---|---|---|---|
| `timetables` | Admin, Teacher, Student | Low (schedule data) | Timetables stop working entirely |
| `examTimetables` | Admin, Teacher, Student | Low | Exam timetable feature non-functional |
| `attendance` | TeacherAttendance | Low | Attendance cannot be recorded |
| `classes` | AdminTimetable, AdminExamTimetable | Low | Class dropdowns empty |
| `subjects` | AdminTimetable, AdminExamTimetable | Low | Subject dropdowns empty |
| `teacherAssignments` | TeacherTimetable, Attendance, Performance | Medium | Teacher sees no classes |
| `schools/{id}/terms/...` | StudentResults, Reports | High | All results/grades blocked |
| `config/gradeSettings` | StudentResults | Low | Grade display breaks |
| `clearancePasses` | StudentResults | Medium | Clearance check fails |
| `clearanceApplications` | ClearanceManagementPage | Medium | Clearance workflow blocked |
| `exeatApplications` | ExeatManagementPage | Medium | Exeat workflow blocked |
| `exeatPasses` | AccessPassPage | Medium | Exit passes non-functional |

**Action:** Add rules for each collection. Suggested approach for school-internal collections (not student-readable):
```javascript
match /timetables/{doc} {
  allow read: if isAuthenticated();
  allow write: if isStudentAdmin();
}
match /examTimetables/{doc} {
  allow read: if isAuthenticated();
  allow write: if isStudentAdmin();
}
match /attendance/{doc} {
  allow read, write: if isTeacher();
}
match /teacherAssignments/{doc} {
  allow read: if isAuthenticated();
  allow write: if isStudentAdmin();
}
```

---

## 6. Data Flow Bugs

### ❌ Bug — `studentData.studentId` is always `undefined`
**File:** `src/pages/student/StudentDashboard.jsx` (~line 40)

```js
getDocs(query(collection(db, 'academicResults'),
  where('studentId', '==', studentData.studentId), ...))
```

The `studentData` object comes from `sessionStorage.getItem('studentSession')`. Looking at what the Login page stores in that session, there is **no `studentId` field** — the session stores `uid`, `regNumber`, `name`, `class`, `dateOfBirth`, etc. The field `studentId` is never set.

**Result:** `studentData.studentId === undefined` → the query matches zero documents → the "Recent Results" widget on the dashboard always shows empty/nothing.

**Fix:** Replace `studentData.studentId` with `studentData.regNumber` (or whichever field `academicResults` uses as its student identifier).

### ❌ Bug — TeacherAttendance ignores `term` when finding the timetable
**File:** `src/pages/teacher/TeacherAttendance.jsx` (~lines 58-81)

The attendance page loads the timetable for the selected class by sorting on year only:
```js
.sort((a, b) => b.year - a.year)[0]
```

This picks the timetable with the highest year, but ignores `term`. If "Term 3 2025" and "Term 1 2026" both exist, it correctly picks 2026 — but if "Term 1 2026" and "Term 2 2026" both exist, it picks whichever is first in the Firestore snapshot (non-deterministic), not the current term.

**Fix:** Also filter or sort by `term` using `getCurrentTerm()` to find the active timetable.

### ⚠️ Minor — `StudentContext` exposes `authLoading: false` hardcoded
**File:** `src/context/StudentContext.jsx` (~line 82)

`authLoading` is always `false` (hardcoded). It's passed to `StudentAuthRoute` as a prop but provides no actual loading-state information. Not a functional bug but dead state.

---

## 7. Logic / Code Bugs

### ❌ Bug — `AdminTimetable.jsx` defaults to hardcoded 'Term 2'
**File:** `src/pages/admin/Timetable.jsx` line 22
```js
const [term, setTerm] = useState('Term 2')
```
After June 2026 the admin timetable will default to the wrong term every time it's opened.

**Fix:**
```js
import { getCurrentTerm } from '../../utils/termHelpers'
const { number: CURR_NUM, year: CURR_YEAR } = getCurrentTerm()
// then:
const [term, setTerm] = useState(`Term ${CURR_NUM}`)
const [year, setYear] = useState(CURR_YEAR)
```

### ❌ Bug — `TeacherTimetable.jsx` defaults to hardcoded 'Term 2'
**File:** `src/pages/teacher/TeacherTimetable.jsx` line 15 (after rewrite)
```js
const [term, setTerm] = useState('Term 2')
```
Same issue as AdminTimetable. `AdminExamTimetable.jsx` correctly uses `getCurrentTerm()` but the weekly timetable does not.

**Fix:** Same as above — import `getCurrentTerm` and use it for the initial state.

### ⚠️ Dead code — `Coursework.jsx` not registered in App.jsx
**File:** `src/pages/Coursework.jsx`  
This page exists and contains a Firestore query but is never imported or registered as a route. It cannot be navigated to.

**Action:** Either register it as a route (if the feature is needed) or delete the file.

---

## 8. Security Issues

### 🔴 HIGH — OTP codes stored in plaintext in Firestore
**File:** `src/pages/webadmin/StudentOTPManager.jsx`

Generated OTP codes are stored as `otpCode: otp` directly in the `users` document. The `users` collection security rule allows unauthenticated reads for student documents where `otpUsed == false`. This means an attacker who knows (or can enumerate) a student's document can read the plaintext OTP before the student uses it.

**Fix:** Store a hashed OTP (SHA-256) and compare hashes on verification. Never store the raw OTP.

### 🔴 HIGH — `loginAttempts` collection is fully open
**File:** `firestore.rules`

```javascript
match /loginAttempts/{id} {
  allow read, create, update: if true; // anyone
}
```

**Consequences:**
1. Any client can read all login attempt records — exposes which accounts are under attack
2. Any client can create fake lockout entries → **denial of service**: lock out any student account permanently
3. Any client can update lockout records → remove locks or forge attempt counts

**Fix:** Restrict reads to admin only. Allow `create` only for unauthenticated clients (rate-limited attempt recording), but never `read` or `update` from the client.

### 🔴 HIGH — `students` collection is world-readable
**File:** `firestore.rules`

```javascript
match /students/{id} {
  allow read: if true;
}
```

All student records — names, registration numbers, class, guardian phone numbers, guardian email addresses, date of birth — are readable by anyone without authentication.

**Fix:** Restrict reads to authenticated staff, or to the specific student (once Firebase Auth is set up for students).

### 🟡 MEDIUM — Student `users` collection bulk-queryable without auth
Firestore rules for `users/{uid}` allow unauthenticated reads for documents matching certain conditions (student accounts with unused OTPs). Per Firestore's security model, rules are **not query filters** — a client can query `where('role', '==', 'student')` and read all matching documents in bulk, exposing all student user records.

### 🟡 MEDIUM — No rate limiting on student login endpoint
`src/pages/Login.jsx` uses `loginAttempts` to track failed attempts, but since the collection is fully writable (see above), the lockout mechanism is trivially defeated — an attacker can reset the attempt count via a direct Firestore write.

---

## 9. Recent Changes Verification

### ✅ Notification fix — CORRECT
**File:** `src/pages/student/StudentNotifications.jsx`

The fix removes `orderBy('createdAt', 'desc')` from the Firestore query (which required a missing composite index) and sorts client-side instead:
```js
docs.sort((a, b) => {
  const at = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0)
  const bt = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0)
  return bt - at
})
```
Handles Firestore `Timestamp` objects (`.toDate()`), JS Dates, and null timestamps. Sort direction is correct (newest first). **Fix is verified correct.**

### ✅ Exam Timetable — functional but needs Firestore index + rules
**Files:** `src/pages/admin/ExamTimetable.jsx`, `src/pages/student/StudentTimetable.jsx`, `src/pages/teacher/TeacherTimetable.jsx`

- Admin page: correctly builds entries array, saves as one document per term/year
- Student page: correctly filters entries by `studentData.class`
- Teacher page: correctly filters entries by `session.name` (invigilator)
- Tab UI: correctly switches between Weekly and Exams/Invigilation views

**Needs:** Composite index `examTimetables (term ASC, year ASC)` + Firestore rule for the `examTimetables` collection.

---

## 10. Prioritised Fix List

### Priority 1 — Fix now (functionality broken)

| # | Issue | File | Fix |
|---|---|---|---|
| 1 | `studentData.studentId` undefined on dashboard | `StudentDashboard.jsx` | Change to `studentData.regNumber` |
| 2 | Missing Firestore composite indexes | Firebase Console | Create 9 indexes (table in §4) |
| 3 | Missing Firestore security rules for 12+ collections | `firestore.rules` | Add rules for all missing collections |
| 4 | `useStudentSessionGuard` never called | `StudentLayout.jsx`, `Login.jsx` | Import and wire up the hook |

### Priority 2 — Fix soon (wrong defaults / minor bugs)

| # | Issue | File | Fix |
|---|---|---|---|
| 5 | `AdminTimetable` defaults to hardcoded 'Term 2' | `src/pages/admin/Timetable.jsx` | Use `getCurrentTerm()` |
| 6 | `TeacherTimetable` defaults to hardcoded 'Term 2' | `src/pages/teacher/TeacherTimetable.jsx` | Use `getCurrentTerm()` |
| 7 | Bursar sidebar duplicate nav entries | `src/components/bursar/BursarSidebar.jsx` | Remove duplicate section |
| 8 | Attendance timetable lookup ignores `term` | `src/pages/teacher/TeacherAttendance.jsx` | Filter by term+year |
| 9 | `/users` route is unprotected | `src/App.jsx` | Move behind `ProtectedRoute` |

### Priority 3 — Security hardening

| # | Issue | Fix |
|---|---|---|
| 10 | OTP stored in plaintext | Hash with SHA-256 before storing |
| 11 | `loginAttempts` collection fully open | Restrict reads/updates to admin only |
| 12 | `students` collection world-readable | Restrict to authenticated users |
| 13 | Student Firebase Auth not implemented | Add `signInWithCustomToken` on student login |

### Priority 4 — Cleanup

| # | Issue | Fix |
|---|---|---|
| 14 | `Coursework.jsx` unreachable dead code | Register route or delete file |
| 15 | `useStudentSessionGuard` dead code (partially covered by #4) | Handled when wired up |
| 16 | `StaffPortalSelect.jsx` untracked in git | Stage and commit |
| 17 | `authLoading: false` hardcoded in StudentContext | Remove or implement properly |

---

## Appendix — Firestore Index Creation Commands

Run these one by one in the Firebase Console → Firestore → Indexes → Composite → Add Index, or add to `firestore.indexes.json`:

```json
{
  "indexes": [
    { "collectionGroup": "examTimetables",  "fields": [{"fieldPath":"term","order":"ASCENDING"},{"fieldPath":"year","order":"ASCENDING"}] },
    { "collectionGroup": "timetables",       "fields": [{"fieldPath":"className","order":"ASCENDING"},{"fieldPath":"term","order":"ASCENDING"},{"fieldPath":"year","order":"ASCENDING"}] },
    { "collectionGroup": "attendance",       "fields": [{"fieldPath":"className","order":"ASCENDING"},{"fieldPath":"date","order":"ASCENDING"}] },
    { "collectionGroup": "receipts",         "fields": [{"fieldPath":"reg_number","order":"ASCENDING"},{"fieldPath":"issuedAt","order":"DESCENDING"}] },
    { "collectionGroup": "notifications",    "fields": [{"fieldPath":"forStudent","order":"ASCENDING"},{"fieldPath":"createdAt","order":"DESCENDING"}] },
    { "collectionGroup": "proofOfPayments",  "fields": [{"fieldPath":"reg_number","order":"ASCENDING"},{"fieldPath":"uploadedAt","order":"DESCENDING"}] },
    { "collectionGroup": "academicResults",  "fields": [{"fieldPath":"studentId","order":"ASCENDING"},{"fieldPath":"uploadedAt","order":"DESCENDING"}] },
    { "collectionGroup": "feeAccounts",      "fields": [{"fieldPath":"balanceType","order":"ASCENDING"},{"fieldPath":"balance","order":"DESCENDING"}] },
    { "collectionGroup": "students",         "fields": [{"fieldPath":"class","order":"ASCENDING"},{"fieldPath":"fullName","order":"ASCENDING"}] }
  ]
}
```

---

*Generated by automated code-level audit — 2026-06-16*
