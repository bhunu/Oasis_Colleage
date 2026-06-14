# Oasis Private College — Features Audit Report
**Date:** 11 June 2026  
**Auditor:** Claude Code (Automated)  
**Scope:** All pages, flows, components, Firestore integrations, charts, and navigation

---

## Status Legend
| Status | Meaning |
|---|---|
| ⬜ PENDING | Not yet addressed |
| 🔄 IN PROGRESS | Work started |
| ✅ DONE | Fixed and verified |

## Completeness Legend
| Tag | Meaning |
|---|---|
| ✅ WORKING | Fully wired to live data and functional |
| ⚠️ PARTIAL | Exists but incomplete — mock data, broken flow, or missing backend |
| 🚫 MOCK | UI renders but has no real backend — hardcoded or fake data |
| ❓ UNVERIFIED | Page exists, implementation not confirmed |

---

## SECTION 1 — PUBLIC WEBSITE

| Page | Status | Notes |
|---|---|---|
| Home `/` | ✅ WORKING | Calendar and gallery pull from Firestore via hooks |
| About `/about` | ✅ WORKING | Leadership from Firestore; timeline is hardcoded (acceptable) |
| Academics `/academics` | ✅ WORKING | Pass rate stats (95%, 91%) are hardcoded — not from real results |
| Admissions `/admissions` | ✅ WORKING | Purely informational; hardcoded content acceptable |
| Campus Life `/campus-life` | ✅ WORKING | Hardcoded content acceptable |
| Calendar `/calendar` | ✅ WORKING | Full CRUD via Firestore |
| Gallery `/gallery` | ✅ WORKING | Upload/delete via Firestore and Firebase Storage |
| Staff `/staff` | ✅ WORKING | Fetches from Firestore via useStaff hook |
| News `/news` | ✅ WORKING | Display works; `/admin/news` accessible from admin sidebar with full CRUD — FA-01 fixed |
| Contact `/contact` | ✅ WORKING | Saves to Firestore `contactEnquiries` collection with timestamp — FA-02 fixed |

---

## SECTION 2 — AUTHENTICATION

| Feature | Status | Notes |
|---|---|---|
| Student login (OTP first-time) | ✅ WORKING | OTP validation, 48hr expiry |
| Student login (password) | ✅ WORKING | MD5 hashing (security risk — see AUDIT_REPORT C-02) |
| Login lockout (3 attempts) | ⚠️ PARTIAL | Works but has casing bug — see AUDIT_REPORT H-03 |
| Staff / Admin login | ✅ WORKING | SessionStorage-based session |
| First-time password setup | ✅ WORKING | OTP required before password set |
| Session timeout (30 min inactivity) | ✅ WORKING | useStudentSessionTimeout hook |
| Route guards (Student/Bursar/Admin) | ⚠️ PARTIAL | Guards are client-side only — see AUDIT_REPORT C-04 |

---

## SECTION 3 — STUDENT PORTAL

| Feature | Status | Notes |
|---|---|---|
| Dashboard | ✅ WORKING | Fee balance, results card, notifications, receipts |
| Results view | ✅ WORKING | Gated by payment threshold and clearance |
| Results total points (A-Level) | ✅ WORKING | Added; shows per-term total |
| Fee account ledger | ✅ WORKING | Debit/credit entries, payment history |
| Upload proof of payment | ✅ WORKING | OCR amount detection for JPG/PNG/PDF |
| Profile view/edit | ✅ WORKING | Read-only academic info; editable contact details |
| Exeat application | ✅ WORKING | BoarderRoute protected; saves to Firestore |
| My exeat applications | ✅ WORKING | Shows past applications with status, dates, and pass serial — FA-03 fixed |
| Clearance application | ✅ WORKING | Gated to exiting students only |
| Clearance status | ✅ WORKING | Shows status, rejection reason, and download link when approved — FA-04 fixed |
| Transfer request | ✅ WORKING | Saves to Firestore; in-portal notification on admin action — FA-05 fixed |
| Notifications display | ✅ WORKING | Real-time bell badge + `/student/notifications` page with mark-as-read — FA-06 fixed |
| Loading skeletons on dashboard | ✅ WORKING | Animated skeleton for fee, results, and quick-action cards — FA-07 fixed |

---

## SECTION 4 — ADMIN / STUDENT ADMIN PORTAL

| Feature | Status | Notes |
|---|---|---|
| Main dashboard | ✅ WORKING | Real student counts, demographics chart |
| Student enrollment (single) | ✅ WORKING | Full form with OTP email dispatch |
| Student enrollment (bulk CSV) | ✅ WORKING | Papa Parse with duplicate detection |
| Student list & detail view | ✅ WORKING | Search, filter, backfill category |
| Registration ID card print | ✅ WORKING | Browser print flow |
| Exam marks upload (CSV) | ✅ WORKING | Validates 0–100 per subject; batch write |
| Coursework management | ❓ UNVERIFIED | Page exists — see FA-08 |
| Reports page | ✅ WORKING | Class/term selector, subject chart, ranked student results, print — FA-09 fixed |
| Fee configuration | ✅ WORKING | O-Level vs A-Level fee per term |
| Arrears tracking (admin) | ✅ WORKING | Live from `feeAccounts`; dynamic class filter; `reg_number` column; CSV export — FA-10 fixed |
| Payments tracking | ✅ WORKING | Reads `receipts`; term from portalSettings; `reg_number`; CSV export — FA-11 fixed |
| End-of-term procedure | ✅ WORKING | Pre-flight loads real feeAccount counts; term from portalSettings; real preview table — FA-12 fixed |
| Student portal management | ✅ WORKING | Portal accounts overview: stat cards, account status per student, link to OTP manager — FA-13 fixed |
| Admin settings | ✅ WORKING | Saves currentTerm/Year to portalSettings/main + termDates to config/schoolSettings — FA-14 fixed |
| Subjects management | ✅ WORKING | Drives exam CSV template headers via classes array-contains query — FA-15 verified |
| Exeat management (admin) | ✅ WORKING | Approve/reject/generate passes |
| Clearance management | ✅ WORKING | Approve/reject/issue letters |
| Access pass generation | ✅ WORKING | Fee-gated; unique serial |
| Class performance analytics | ✅ WORKING | Real Firestore data, rankings, subject analysis, print/export — FA-16 fixed |
| Classes management | ✅ WORKING | Authoritative class list; Enrol.jsx now reads from Firestore — FA-17 fixed |
| Grade settings | ✅ WORKING | Warning banner added when unconfigured; saves to config/gradeSettings — FA-18 fixed |
| Prize giving / rankings | ✅ WORKING | Real exam data, points/avg ranking, subject champions, print/export — FA-19 fixed |
| News admin interface | ✅ WORKING | Full CRUD in /admin/news; link in sidebar — FA-20 verified |
| Staff admin interface | ✅ WORKING | Full CRUD with photo upload to Firebase Storage — FA-21 verified |
| Auto exitType batch (Term 3) | ✅ WORKING | Marks Form 4 / Upper 6 on Term 3 close |

---

## SECTION 5 — BURSAR PORTAL

| Feature | Status | Notes |
|---|---|---|
| Dashboard stat cards | ✅ WORKING | Collected, arrears, expenses, surplus — all live |
| Collections by month chart | ✅ WORKING | From receipts collection |
| Collections by payment method chart | ✅ WORKING | From receipts collection |
| Expense breakdown pie chart | ✅ WORKING | Live from expenseByCategory state; empty state when no data — FA-22 fixed |
| Income vs expenses trend chart | ✅ WORKING | Grouped by `term` field from receipts + expenses; empty state for single-term — FA-23 fixed |
| Income statement panel (dashboard) | ✅ WORKING | Grouped by expense category from Firestore |
| Balance sheet panel (dashboard) | ✅ WORKING | Live from feeAccounts + expenses |
| Receive payment | ✅ WORKING | QR receipt, auto-incrementing number |
| Auto-redirect from arrears to receive payment | ✅ WORKING | Reg number pre-filled |
| Issue receipt (dedicated page) | ✅ WORKING | Receipt reprint by search (number, name, reg); QR print — FA-24 verified |
| Student accounts lookup | ✅ WORKING | Search and view per-student account |
| Arrears page | ✅ WORKING | Lists debit accounts with reg number in ID column |
| Budget overview | ✅ WORKING | Real Firestore spending; removed fake allocated budget; category table with % — FA-25 fixed |
| Record expense | ✅ WORKING | Saves category, amount, receipt image to Firestore |
| Expense categories management | ✅ WORKING | Real expense data with pie chart and drill-down table — FA-26 verified |
| Income statement (full page) | ✅ WORKING | Tuition only (no fake lines); term selector derives options from feeAccounts; filters by term — FA-27 fixed |
| Balance sheet (full page) | ✅ WORKING | Firestore reads (feeAccounts, expenses); inline asset register (add/delete) — FA-28 fixed |
| Collection report | ✅ WORKING | Term dropdown derived from receipt data; filters table + chart + stats by term — FA-29 fixed |
| Print reports | ✅ WORKING | Navigation hub to all financial reports; no data of its own — FA-30 verified |
| Bursar settings (full) | ⚠️ PARTIAL | Live previews working; fee application working |
| Apply fees by level | ✅ WORKING | O-Level vs A-Level; uses reg_number lookup |
| Results access gate settings | ✅ WORKING | Live preview for both O and A level |
| POP review (approve/reject) | ✅ WORKING | Rejection reason required on reject; shown in student upload history — FA-31 fixed |

---

## SECTION 6 — WEB ADMIN

| Feature | Status | Notes |
|---|---|---|
| Student OTP generation | ✅ WORKING | 8-char OTP, 48hr expiry, email dispatch |
| Active OTP log | ✅ WORKING | View/revoke active OTPs |
| Portal settings (threshold, term, year) | ✅ WORKING | Saved to portalSettings/main |
| Security logs display | ✅ WORKING | Real-time onSnapshot; action filters; locked accounts tab with unlock — FA-32 verified |

---

## PENDING TASK LIST

---

### FA-01 — No Admin Interface for News Creation ✅ DONE
- **Where:** `/news` public page, `/admin/news`
- **Fixed:** `/admin/news` confirmed reachable from admin sidebar. Full create/edit/delete wired to Firestore with two-step delete confirmation.

---

### FA-02 — Contact Form Submits But Does Nothing ✅ DONE
- **Where:** `src/pages/Contact.jsx`
- **Fixed:** Form now saves to `contactEnquiries` Firestore collection with `name`, `email`, `phone`, `subject`, `message`, `read: false`, and `createdAt: serverTimestamp()`. Fake timeout removed; real error handling added.

---

### FA-03 — "My Exeat Applications" Display Not Verified ✅ DONE
- **Where:** `src/pages/student/MyExeatApplications.jsx`
- **Fixed:** Page displays all past applications with status badges (Pending / Approved / Rejected), submission dates, destination/reason, and pass serial number for approved applications.

---

### FA-04 — Clearance Status Page Not Verified ✅ DONE
- **Where:** `src/pages/student/MyClearanceStatus.jsx`
- **Fixed:** Page shows submission date, current status badge, rejection reason when rejected, and clearance letter download link when approved. Full lifecycle confirmed.

---

### FA-05 — Transfer Request Form Not Fully Implemented ✅ DONE
- **Where:** `src/pages/student/TransferRequestForm.jsx`
- **Fixed:** Form saves to `transferRequests` Firestore collection. Admin can action requests. Student receives in-portal notification on approval or rejection.

---

### FA-06 — Notifications Not Consistently Displayed Across Portal ✅ DONE
- **Where:** `src/pages/student/StudentNotifications.jsx`, `src/pages/student/StudentLayout.jsx`
- **Fixed:** Created `/student/notifications` page listing all notifications ordered by date with read/unread state, mark-as-read on click, and "Mark all read" batch action. Bell icon in topbar and sidebar nav item both show real-time amber unread count badge via `onSnapshot`. Dashboard notification query fixed to use `forStudent` field.

---

### FA-07 — Student Dashboard Shows $0.00 While Data Loads ✅ DONE
- **Where:** `src/pages/student/StudentDashboard.jsx`
- **Fixed:** Added `loading` state gated on feeAccount + receipts fetches. Full-page skeleton renders animated placeholder cards matching the layout until data arrives.

---

### FA-08 — Coursework Management Page Unverified ⬜ PENDING
- **Where:** `/coursework`
- **Issue:** Page is routed and visible in navigation but the full implementation (subject selection, mark entry per student, save to Firestore, student view of coursework marks) has not been confirmed.
- **Fix:** Confirm teacher can select class → subject → enter mark per student → save. Confirm marks appear on the student's results page or a dedicated coursework view.

---

### FA-09 — Reports Page Unverified ✅ DONE
- **Where:** `src/pages/Reports.jsx`
- **Fixed:** Page is fully wired to Firestore. Provides class+term selector, subject performance bar chart with class averages and pass rates, and ranked student results table with grade/distinction badges. Print button present. Fixed inline `SCHOOL_ID` constant to use centralized import.

---

### FA-10 — Admin Arrears Page Unverified ✅ DONE
- **Where:** `src/pages/Arrears.jsx`
- **Fixed:** Page reads from `feeAccounts` where `balanceType == 'debit'`. Fixed hardcoded `CURRENT_TERM = '2-2025'` — now fetches from `portalSettings/main`. Class filter now derives dynamically from loaded accounts (no more hardcoded class list). ID column changed from `studentId` to `reg_number`. CSV export field names corrected. Note: this is the admin view; the bursar has a separate arrears page in the bursar portal.

---

### FA-11 — Payments Tracking Page Unverified ✅ DONE
- **Where:** `src/pages/Payments.jsx`
- **Fixed:** Was reading from a non-existent `termTransactions` collection — switched to `receipts`. Fixed hardcoded `CURRENT_TERM = '2-2025'` — now fetches `Term ${currentTerm}` from `portalSettings/main`. Updated all field names (`issuedAt`, `reg_number`, `receiptNumber`). Added CSV export button with quoted fields.

---

### FA-12 — End-of-Term Summary Shows Mock Data ✅ DONE
- **Where:** `src/pages/EndOfTerm.jsx`
- **Fixed:** Removed all `mockSummary` and `mockAccountsPreview` constants. On page load, fetches current term from `portalSettings/main`, derives opening term automatically (Term 3→1 of next year). Loads all `feeAccounts` for the term and computes real stats (total, nil, debit/arrears, credit counts and totals). Stat cards, account preview table (top 10 by balance), and confirm modal message all show live Firestore data. Completion screen shows real processed counts. "Run" button is disabled until pre-flight succeeds. Retry button on pre-flight error.

---

### FA-13 — Student Portal Management Page Unverified ✅ DONE
- **Where:** `src/pages/StudentPortal.jsx`
- **Fixed:** Was a fully mock stub (hardcoded $620 balance, fake ledger). Replaced with a real **Portal Accounts Overview**: reads `users` (role=student) and `students` collections to show stat cards (total students, password set, OTP issued, never onboarded). Table shows account status badge per student with a direct "Generate OTP →" link to the OTP manager for those without access. No overlap with `/otp-manager` — this is the overview; that is the action page.

---

### FA-14 — Admin Settings Page Unverified ✅ DONE
- **Where:** `src/pages/Settings.jsx`
- **Fixed:** Audited all settings. `termStartDate`/`termEndDate` correctly go to `config/schoolSettings` where `useTermDates` reads them. However, `currentTerm`/`currentYear` were being saved only to `config/schoolSettings` while every other page (Arrears, Payments, EndOfTerm, etc.) reads from `portalSettings/main` — a silent disconnect. Fixed: `handleSaveSchool` now writes `currentTerm`/`currentYear` to `portalSettings/main` (merged) in parallel, and `load()` reads them back from there on mount. School name/address and term dates remain in `config/schoolSettings`.

---

### FA-15 — Subjects Management Page Unverified ✅ DONE
- **Where:** `src/pages/Subjects.jsx`, `src/pages/Exams.jsx`
- **Verified:** Subjects are fully wired to exam uploads. `Exams.jsx` calls `handleDownloadTemplate()` which queries `subjects where classes array-contains className` to generate a CSV with subject columns matching exactly what was configured in the Subjects page. Subject-to-level mapping is handled by the `classes` array field on each subject — subjects assigned to Form 1–4 classes are O Level; those on Lower/Upper 6 classes are A Level. No fix needed.

---

### FA-16 — Class Performance Analytics Unverified ✅ DONE
- **Where:** `src/pages/admin/ClassPerformancePage.jsx`
- **Verified:** Reads real Firestore data from `schools/oasis/terms/{termId}/classes/{classId}/students`. Has class and term dropdowns, full subject analysis table, ranked student table with click-through breakdown modal, CSV export, and print. Fixed hardcoded `const SCHOOL_ID = 'oasis'` → `import { SCHOOL_ID } from '../../utils/schoolConfig'`.

---

### FA-17 — Classes Management Page Unverified ✅ DONE
- **Where:** `src/pages/Classes.jsx`, `src/pages/Enrol.jsx`, `src/pages/Exams.jsx`
- **Fixed:** `Classes.jsx` is the authoritative source — adds/deletes from `classes` Firestore collection. `Exams.jsx` already read from it. `Enrol.jsx` had a hardcoded `CLASSES` array (18 fixed options) that didn't update when classes were added/removed. Fixed: removed hardcoded array, added `getDocs(collection(db, 'classes'))` useEffect, class dropdown now reads from Firestore.

---

### FA-18 — Grade Settings Page Saves But Results Page Uses Hardcoded Fallback ✅ DONE
- **Where:** `src/pages/GradeSettings.jsx`
- **Fixed:** Added `isConfigured` state — set to `false` when `getDoc` returns no existing document. When unconfigured, an amber warning banner appears: "Grade settings not yet saved — the student results portal is currently using default grade ranges. Save your settings to apply them." Banner clears on successful save.

---

### FA-19 — Prize Giving / Rankings Page Unverified ✅ DONE
- **Where:** `src/pages/admin/PrizeGivingPage.jsx`
- **Verified:** Reads real exam results from `schools/oasis/terms/{termId}/classes/{classId}/students`. Supports O Level (ranked by average) and A Level (ranked by total points). Subject champions are computed from real marks. Has CSV export (rankings + subject champions) and CSS print. Fixed hardcoded `const SCHOOL_ID = 'oasis'` → `import { SCHOOL_ID } from '../../utils/schoolConfig'`.

---

### FA-20 — No Admin Interface for News Articles ✅ DONE
- **Where:** `src/components/admin/Sidebar.jsx`, `src/components/admin/Layout.jsx`, `src/pages/admin/News.jsx`
- **Verified:** "News" link is present in the admin sidebar (line 15 of Sidebar.jsx). `/admin/news` route is registered in Layout.jsx. `AdminNews.jsx` is a full CRUD page with create, edit, delete, image upload to Firebase Storage, and category tagging. No fix needed — already fully functional.

---

### FA-21 — No Admin Interface for Staff Management ✅ DONE
- **Where:** Admin sidebar / `/admin/staff`
- **Verified:** `src/pages/admin/Staff.jsx` has full CRUD — add/edit staff members with role assignment, photo upload to Firebase Storage, and delete with confirmation. "Staff" link present in admin sidebar and route registered in Layout.jsx.

---

### FA-22 — Expense Breakdown Pie Chart Uses Hardcoded Data ✅ DONE
- **Where:** `src/pages/bursar/BursarDashboard.jsx`
- **Fixed:** Removed `expenseData` constant. `expensePieData` computed via `useMemo` from `expenseByCategory` Firestore state — shows actual dollar amounts per category, not fake percentages. Empty state shown when no expenses recorded.

---

### FA-23 — Income vs Expenses Trend Chart Uses Hardcoded Data ✅ DONE
- **Where:** `src/pages/bursar/BursarDashboard.jsx`
- **Fixed:** Removed `trendData` constant. Added `incByTerm` and `expByTerm` state — receipts grouped by `r.term`, expenses grouped by `e.term`. `liveTrendData` computed via `useMemo` from those two maps. Chart renders one point per term present in data. Empty state shown if only one-term data exists.

---

### FA-24 — Issue Receipt Dedicated Page Unverified ✅ DONE
- **Where:** `src/pages/bursar/IssueReceipt.jsx`
- **Verified:** This is the receipt reprint/search page. Bursar can search `receipts` by receipt number, student name, or reg number. Full receipt view with QR code, all payment details, and browser print. Separate from Receive Payment (which records new payments). No changes needed.

---

### FA-25 — Budget Overview Page Unverified ✅ DONE
- **Where:** `src/pages/bursar/BudgetOverview.jsx`
- **Fixed:** Had fake `budgets` array with hardcoded `allocated` amounts and `|| 22400` fallbacks. Removed entirely. Page now shows: 3 summary cards (Total Expenses, Expense Entries, Top Category — all live), bar chart by category (real Firestore data), and a category breakdown table with total, entry count, and % of total. No fake budget figures.

---

### FA-26 — Expense Categories Management Unverified ✅ DONE
- **Where:** `src/pages/bursar/ExpenseCategories.jsx`
- **Verified:** Page reads real `expenses` from Firestore, shows a pie chart by category, and a drill-down table per category. It is an analytics/reporting view, not a category management UI. Both `ExpenseCategories.jsx` and `RecordExpense.jsx` share the same hardcoded `CATEGORIES` constant — consistent and acceptable. No wiring issue.

---

### FA-27 — Income Statement Full Page Unverified ✅ DONE
- **Where:** `src/pages/bursar/IncomeStatement.jsx`
- **Fixed:** Had hardcoded `examFees = 3800`, `sports = 1200`, `otherInc = 800`, `tuition || 47200`, and `catTotal('Salaries') || 22400` fallbacks. Removed all. Income is now tuition only from `feeAccounts`. Term selector derives options dynamically from `feeAccounts.term` (format "2-2025"). Filtering parses selected term string to match both feeAccounts format (`"2-2025"`) and expenses format (`"Term 2"`). Expense rows only render when non-zero. Print and CSV export updated.

---

### FA-28 — Balance Sheet Full Page Unverified ✅ DONE
- **Where:** `src/pages/bursar/BalanceSheet.jsx`
- **Fixed:** Was fully hardcoded (cash: 18400, receivables: 12600, equipment: 34000). Rewrote to read from Firestore: cash from `feeAccounts.totalPaid` sum, receivables from debit `feeAccounts` sum, deferred from credit `feeAccounts` sum, liabilities from `expenses` sum. Added **Asset Register** — bursar can add/delete physical assets (name + value) stored in `assets` collection; each appears as a line in the balance sheet and contributes to Total Assets. "As at" date picker, print, and CSV export retained.

---

### FA-29 — Collection Report Page Unverified ✅ DONE
- **Where:** `src/pages/bursar/CollectionReport.jsx`
- **Fixed:** Had hardcoded term dropdown ("Term 2 2025", "Term 1 2025", "Term 3 2024") that didn't actually filter data. Fixed: term options derived dynamically from `r.term` values in loaded receipts; selector defaults to most recent term. `filtered` array gates summary cards (total collected, receipt count, average), monthly bar chart, and receipts table. "All terms" option available. CSV export filename uses selected term. Note: receipts store term as "Term 2" without year — a data limitation in RecordExpense.jsx.

---

### FA-30 — Print Reports Page Unverified ✅ DONE
- **Where:** `src/pages/bursar/PrintReports.jsx`
- **Verified:** Navigation hub linking to Income Statement, Balance Sheet, Collection Report, and Budget Overview — each of which has its own print button. No data of its own. Fully functional as a reports index page.

---

### FA-31 — POP Reviewer Cannot Send Rejection Reason to Student ✅ DONE
- **Where:** `src/pages/bursar/ReviewPOP.jsx`, `src/pages/student/StudentUploadPOP.jsx`
- **Fixed:** `ReviewPOP.jsx` created with required `rejectionReason` text field on reject (submit blocked until reason provided). Rejection reason and status badge shown in student's "Previous Submissions" history panel.

---

### FA-32 — Security Logs Display Page Unverified ✅ DONE
- **Where:** `src/pages/webadmin/SecurityLogs.jsx`
- **Verified:** Real-time `onSnapshot` on `securityLogs` collection (limit 200, ordered by timestamp desc). Action filter tabs (All / Login Success / Login Failed / OTP Generated / etc.), full-text search, CSV export. "Locked Accounts" tab reads `loginAttempts` collection and shows manual unlock button. No changes needed.

---

## SECTION 7 — COMPLETELY MISSING FEATURES

These features have no implementation anywhere in the codebase and represent significant functional gaps.

---

### FA-33 — No Attendance Tracking System ⬜ PENDING
- **Issue:** There is no attendance register, no way to mark students present/absent, and no attendance reports. This is a core school management function.
- **Suggested Implementation:** 
  - Teacher marks attendance per class per day
  - Admin views attendance summary per student
  - Student can view own attendance record
  - Alert when attendance drops below a threshold (e.g. 80%)

---

### FA-34 — No Parent / Guardian Communication System ⬜ PENDING
- **Issue:** Guardian contact details are collected at enrollment but there is no way to contact guardians from the system. No messaging, email blast, or SMS capability.
- **Suggested Implementation:**
  - "Send Notice" form to email all guardians in a class or all guardians of students in arrears
  - Guardian portal access (read-only: results, fee balance, notifications)
  - Bulk SMS integration (for Zimbabwe: EcoCash/NetOne SMS gateway)

---

### FA-35 — No Timetable / Class Schedule Management ⬜ PENDING
- **Issue:** No class timetable, teacher schedule, or room assignment system exists.
- **Suggested Implementation:**
  - Admin creates weekly timetable per class
  - Teachers see their own schedule
  - Students see their class timetable in the portal

---

### FA-36 — No Discipline / Conduct Records ⬜ PENDING
- **Issue:** No system for recording disciplinary incidents, warnings, or suspensions. Clearance forms mention conduct but there's nothing to feed it.
- **Suggested Implementation:**
  - Record disciplinary incidents per student with severity, date, and resolution
  - Summary shown in student profile (admin/teacher view only)
  - Flagged automatically in clearance review if outstanding incidents

---

### FA-37 — No Teacher / Staff Portal ⬜ PENDING
- **Issue:** Teachers have no dedicated portal. They cannot submit marks online (admin uploads via CSV), view their classes, or communicate with students/admin through the system.
- **Suggested Implementation:**
  - Teacher logs in with staff credentials
  - Views assigned classes
  - Submits coursework marks and exam predictions
  - Views class performance analytics

---

### FA-38 — No Medical / Health Records ⬜ PENDING
- **Issue:** Enrollment form collects medical history (allergies, chronic conditions) but there is no health records management, no sick bay log, and no way to view medical info when needed.
- **Suggested Implementation:**
  - View medical details in student profile (admin/nurse access)
  - Sick bay visit log
  - Emergency contact quick-access in student profile

---

### FA-39 — Academic Calendar Not Linked to Marks/Terms ⬜ PENDING
- **Issue:** The public calendar displays events but is not connected to the academic term structure. The `currentTerm` / `currentYear` in `portalSettings` is manually set and does not auto-advance when a calendar term date passes.
- **Fix:** When term end date passes, automatically advance `currentTerm` in `portalSettings`. Show a prominent admin warning if term has ended but `currentTerm` hasn't been updated.

---

### FA-40 — No Bulk SMS / Notification to All Students or Class ⬜ PENDING
- **Issue:** There is no way to send a system notification to all students, all students in a class, or all students in arrears. Notifications are only created individually (e.g., on clearance approval).
- **Suggested Implementation:**
  - Admin writes message → selects target (all / by class / by arrears status) → creates notification documents in bulk
  - Optional: Email and/or SMS delivery

---

### FA-41 — Hardcoded Academic Pass Rate Stats on Public Site ⬜ PENDING
- **Where:** `src/pages/Academics.jsx`
- **Issue:** O-Level 95% pass rate and A-Level 91% pass rate displayed on the public academics page are hardcoded. These should ideally reflect actual uploaded results or be manually updatable by admin.
- **Fix:** Either (a) compute from actual exam results in Firestore, or (b) add an admin field in settings to update the displayed pass rates each year.

---

### FA-42 — No CSV / PDF Export on Any Report Page ⬜ PENDING
- **Issue:** Multiple report pages exist (collection report, income statement, balance sheet, arrears) but none of them have confirmed export functionality. Bursar cannot generate a file to send to the headmaster or board.
- **Fix:** Add "Export CSV" and "Export PDF" buttons to:
  - `/bursar/collection-report`
  - `/bursar/income-statement`
  - `/bursar/arrears`
  - `/bursar/balance-sheet`
  - Admin results/performance pages

---

### FA-43 — Student Can Submit Multiple Exeat Applications Concurrently ✅ DONE
- **Where:** `src/pages/student/ExeatApplicationForm.jsx`
- **Fixed:** On mount, queries for active exeat (`status in ['Pending', 'Approved']`). If one exists, shows a blocking screen with the active application's status — form is hidden until the previous application resolves.

---

### FA-44 — Academics Page Pass Rates Are Hardcoded ⬜ PENDING
- **Where:** `src/pages/Academics.jsx`
- **Issue:** `95% O-Level pass rate` and `91% A-Level pass rate` are hardcoded marketing figures. Not derived from actual uploaded results.
- **Fix:** Add an admin-editable "annual stats" document in Firestore that lets the headmaster update these figures each year. Display those values on the public page.

---

### FA-45 — No Financial Year Rollover / Archive ⬜ PENDING
- **Issue:** When a new academic year begins, all fee accounts carry over. There is no archive of previous year financial data and no clear separation between years in reports.
- **Fix:** End-of-year procedure should archive current fee accounts to a `feeAccountsArchive/{year}` sub-collection before resetting for the new year.

--- 

## Summary by Status

| Category | Total | ✅ Working | ⚠️ Partial | 🚫 Mock | ❓ Unverified |
|---|---|---|---|---|---|
| Public Website | 10 | 9 | 1 | 0 | 0 |
| Authentication | 7 | 5 | 2 | 0 | 0 |
| Student Portal | 13 | 13 | 0 | 0 | 0 |
| Admin Portal | 25 | 24 | 0 | 0 | 1 |
| Bursar Portal | 23 | 22 | 1 | 0 | 0 |
| Web Admin | 4 | 4 | 0 | 0 | 0 |
| **Total** | **82** | **77** | **4** | **0** | **1** |

---

## Recommended Fix Order

**Remaining immediate (misleading admin):**
1. FA-12 — End-of-term shows real pre-flight numbers, not mock
2. FA-22 — Expense pie chart wired to real data
3. FA-23 — Income/expense trend wired to real data

**High value (core workflows):**
4. FA-18 — Grade settings page linked to results display

**Unverified pages (review and confirm or fix):**
5. FA-08 through FA-17, FA-24 through FA-30, FA-32 — audit each page

**New features (roadmap):**
6. FA-33 — Attendance tracking
7. FA-37 — Teacher portal
8. FA-34 — Guardian communication
9. FA-40 — Bulk notification system
10. FA-42 — CSV/PDF export on all reports

**Completed this sprint:** FA-01 through FA-07, FA-09 through FA-32 (excluding FA-08), FA-43
