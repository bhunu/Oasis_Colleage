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
| News `/news` | ⚠️ PARTIAL | Display works; no admin interface visible on public site — see FA-01 |
| Contact `/contact` | 🚫 MOCK | Form shows success toast but does NOT save or email — see FA-02 |

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
| My exeat applications | ⚠️ PARTIAL | Page exists — see FA-03 |
| Clearance application | ✅ WORKING | Gated to exiting students only |
| Clearance status | ⚠️ PARTIAL | Page exists — see FA-04 |
| Transfer request | ⚠️ PARTIAL | Form exists — see FA-05 |
| Notifications display | ⚠️ PARTIAL | Created but not shown consistently — see FA-06 |
| Loading skeletons on dashboard | 🚫 MOCK | Shows $0.00 while loading — see FA-07 |

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
| Reports page | ❓ UNVERIFIED | Page exists — see FA-09 |
| Fee configuration | ✅ WORKING | O-Level vs A-Level fee per term |
| Arrears tracking (admin) | ❓ UNVERIFIED | Page exists — see FA-10 |
| Payments tracking | ❓ UNVERIFIED | Page exists — see FA-11 |
| End-of-term procedure | ⚠️ PARTIAL | Runs procedure; summary shows mock data — see FA-12 |
| Student portal management | ❓ UNVERIFIED | Page exists — see FA-13 |
| Admin settings | ❓ UNVERIFIED | Page exists — see FA-14 |
| Subjects management | ❓ UNVERIFIED | Page exists — see FA-15 |
| Exeat management (admin) | ✅ WORKING | Approve/reject/generate passes |
| Clearance management | ✅ WORKING | Approve/reject/issue letters |
| Access pass generation | ✅ WORKING | Fee-gated; unique serial |
| Class performance analytics | ❓ UNVERIFIED | Page exists — see FA-16 |
| Classes management | ❓ UNVERIFIED | Page exists — see FA-17 |
| Grade settings | ⚠️ PARTIAL | Settings page exists but results page uses hardcoded fallback — see FA-18 |
| Prize giving / rankings | ⚠️ PARTIAL | Page exists — see FA-19 |
| News admin interface | 🚫 MOCK | No visible create/edit for news — see FA-20 |
| Staff admin interface | 🚫 MOCK | No visible add/edit for staff — see FA-21 |
| Auto exitType batch (Term 3) | ✅ WORKING | Marks Form 4 / Upper 6 on Term 3 close |

---

## SECTION 5 — BURSAR PORTAL

| Feature | Status | Notes |
|---|---|---|
| Dashboard stat cards | ✅ WORKING | Collected, arrears, expenses, surplus — all live |
| Collections by month chart | ✅ WORKING | From receipts collection |
| Collections by payment method chart | ✅ WORKING | From receipts collection |
| Expense breakdown pie chart | 🚫 MOCK | Still hardcoded — see FA-22 |
| Income vs expenses trend chart | 🚫 MOCK | Still hardcoded — see FA-23 |
| Income statement panel (dashboard) | ✅ WORKING | Grouped by expense category from Firestore |
| Balance sheet panel (dashboard) | ✅ WORKING | Live from feeAccounts + expenses |
| Receive payment | ✅ WORKING | QR receipt, auto-incrementing number |
| Auto-redirect from arrears to receive payment | ✅ WORKING | Reg number pre-filled |
| Issue receipt (dedicated page) | ❓ UNVERIFIED | Page exists — see FA-24 |
| Student accounts lookup | ✅ WORKING | Search and view per-student account |
| Arrears page | ✅ WORKING | Lists debit accounts with reg number in ID column |
| Budget overview | ❓ UNVERIFIED | Page exists — see FA-25 |
| Record expense | ✅ WORKING | Saves category, amount, receipt image to Firestore |
| Expense categories management | ❓ UNVERIFIED | Page exists — see FA-26 |
| Income statement (full page) | ❓ UNVERIFIED | Page exists — see FA-27 |
| Balance sheet (full page) | ❓ UNVERIFIED | Page exists — see FA-28 |
| Collection report | ❓ UNVERIFIED | Page exists — see FA-29 |
| Print reports | ❓ UNVERIFIED | Page exists — see FA-30 |
| Bursar settings (full) | ⚠️ PARTIAL | Live previews working; fee application working |
| Apply fees by level | ✅ WORKING | O-Level vs A-Level; uses reg_number lookup |
| Results access gate settings | ✅ WORKING | Live preview for both O and A level |
| POP review (approve/reject) | ⚠️ PARTIAL | No rejection reason field — see FA-31 |

---

## SECTION 6 — WEB ADMIN

| Feature | Status | Notes |
|---|---|---|
| Student OTP generation | ✅ WORKING | 8-char OTP, 48hr expiry, email dispatch |
| Active OTP log | ✅ WORKING | View/revoke active OTPs |
| Portal settings (threshold, term, year) | ✅ WORKING | Saved to portalSettings/main |
| Security logs display | ❓ UNVERIFIED | Page exists — see FA-32 |

---

## PENDING TASK LIST

---

### FA-01 — No Admin Interface for News Creation ⬜ PENDING
- **Where:** `/news` public page, `/admin/news`
- **Issue:** Users can read news on the public site but there is no visible, accessible interface for admins to create, edit, or delete news articles. The `/admin/news` route exists in the router but it's unclear if it's reachable from any navigation menu.
- **Fix:** Verify `/admin/news` is reachable. Add it to the admin sidebar navigation if not already present. Confirm create/edit/delete functionality is working.

---

### FA-02 — Contact Form Submits But Does Nothing ⬜ PENDING
- **Where:** `src/pages/Contact.jsx`
- **Issue:** Contact form shows a success toast and clears the form after a fake 1.2-second delay. No data is saved to Firestore and no email is sent. Enquiries from prospective students and parents are silently lost.
- **Fix:** Either (a) save submissions to a Firestore `contactEnquiries` collection with a timestamp and notify admin, or (b) integrate with EmailJS/Firebase Cloud Function to send an email to the school's contact address.

---

### FA-03 — "My Exeat Applications" Display Not Verified ⬜ PENDING
- **Where:** `src/pages/student/` (exeat history page)
- **Issue:** The page exists and is routed, but the display logic (showing past applications with their status, dates, and reason) has not been confirmed as complete.
- **Fix:** Open the page as a boarder student and confirm all past applications show correctly with statuses: Pending / Approved / Rejected. Confirm approved applications show the pass serial number.

---

### FA-04 — Clearance Status Page Not Verified ⬜ PENDING
- **Where:** `src/pages/student/clearance/status` (or similar)
- **Issue:** Clearance status page is routed but its full display has not been confirmed. Students should be able to see: submission date, current status, rejection reason if rejected, and download link if approved.
- **Fix:** Test full clearance lifecycle (submit → admin approves → student sees approved + download link). Confirm rejection reason is surfaced to the student.

---

### FA-05 — Transfer Request Form Not Fully Implemented ⬜ PENDING
- **Where:** `src/pages/student/transfer` (or similar)
- **Issue:** Transfer request form exists but the backend flow (saving to Firestore, notifying admin, admin approval/rejection) has not been confirmed as complete.
- **Fix:** Confirm form saves to `transferRequests` collection. Add admin view to see and action transfer requests. Notify student of outcome.

---

### FA-06 — Notifications Not Consistently Displayed Across Portal ⬜ PENDING
- **Where:** `src/pages/student/StudentDashboard.jsx`, notification bell in layout
- **Issue:** Notifications are created in Firestore (e.g. on clearance approval) but are only partially surfaced in the student portal. No dedicated notifications page. Notification bell counter may not reflect unread count correctly.
- **Fix:** Add a `/student/notifications` page listing all notifications for the student with read/unread state. Notification bell in the student layout header should show unread count badge in real time.

---

### FA-07 — Student Dashboard Shows $0.00 While Data Loads ⬜ PENDING
- **Where:** `src/pages/student/StudentDashboard.jsx`
- **Issue:** While fee account data is fetching, the dashboard displays `$0.00 paid of $0.00` and `0% paid`. A student seeing this momentarily may panic thinking their payment wasn't recorded.
- **Fix:** Add a loading skeleton or spinner to the fee balance card and results card while data is being fetched.

---

### FA-08 — Coursework Management Page Unverified ⬜ PENDING
- **Where:** `/coursework`
- **Issue:** Page is routed and visible in navigation but the full implementation (subject selection, mark entry per student, save to Firestore, student view of coursework marks) has not been confirmed.
- **Fix:** Confirm teacher can select class → subject → enter mark per student → save. Confirm marks appear on the student's results page or a dedicated coursework view.

---

### FA-09 — Reports Page Unverified ⬜ PENDING
- **Where:** `/reports`
- **Issue:** Page exists in routing but its content and functionality are unknown. Could be UI-only or partially wired.
- **Fix:** Review the page. If UI-only, wire to real Firestore data. If functional, document what reports are available. Add export to PDF/CSV where missing.

---

### FA-10 — Admin Arrears Page Unverified ⬜ PENDING
- **Where:** `/arrears`
- **Issue:** Admin arrears page exists alongside the bursar arrears page. Whether it shows the same data, different data, or is a duplicate needs to be confirmed.
- **Fix:** Review and confirm purpose. If duplicate of bursar view, consider removing or redirecting. If different scope, document the distinction.

---

### FA-11 — Payments Tracking Page Unverified ⬜ PENDING
- **Where:** `/payments`
- **Issue:** Admin payments page exists but its full implementation (filtering, export, per-student drill-down) is unconfirmed.
- **Fix:** Review the page. Confirm it reads from `receipts` collection. Add CSV export if missing.

---

### FA-12 — End-of-Term Summary Shows Mock Data ⬜ PENDING
- **Where:** `src/pages/EndOfTerm.jsx:9`
- **Issue:** The end-of-term confirmation modal shows `const mockSummary = { ... }` with hardcoded numbers of accounts, arrears, credits. Admins see fake figures before confirming an irreversible operation.
- **Fix:** Replace `mockSummary` with a real pre-flight query: count debit accounts (arrears to carry forward), credit accounts, and zero-balance accounts from `feeAccounts`. Show real numbers in the confirmation modal.

---

### FA-13 — Student Portal Management Page Unverified ⬜ PENDING
- **Where:** `/student-portal`
- **Issue:** Page exists but its settings (what it controls, what it saves) are unconfirmed. Could overlap with portal settings in the OTP manager.
- **Fix:** Review and confirm scope. Consolidate with `/otp-manager` portal settings tab if overlapping.

---

### FA-14 — Admin Settings Page Unverified ⬜ PENDING
- **Where:** `/settings`
- **Issue:** Admin settings page exists but settings saved there may not actually be consumed anywhere in the system.
- **Fix:** Audit every setting on the page and trace each one to where it is read/applied. Remove settings that have no effect. Document those that do.

---

### FA-15 — Subjects Management Page Unverified ⬜ PENDING
- **Where:** `/subjects`
- **Issue:** Page exists. Subjects list should drive the subject column headers in exam CSV upload and coursework. Unclear if the two are connected.
- **Fix:** Confirm subjects saved here are used as validation in exam upload. If not, wire them. Add subject-to-level mapping (O-Level vs A-Level subjects).

---

### FA-16 — Class Performance Analytics Unverified ⬜ PENDING
- **Where:** `/class-performance`
- **Issue:** Page exists but whether it displays real data (average marks per class, top/bottom subjects, pass rates) or placeholder content is unconfirmed.
- **Fix:** Review and confirm it reads from the `schools/oasis/terms/…` results path. Add filters for term and class. Export to PDF.

---

### FA-17 — Classes Management Page Unverified ⬜ PENDING
- **Where:** `/classes`
- **Issue:** Page exists. Class list should be the authoritative source for class names used across enrollment, exam upload, and fee assignment. Unclear if connected.
- **Fix:** Confirm classes saved here are offered as dropdown options in Enrol.jsx, Exams.jsx, and Coursework.jsx. If hardcoded elsewhere, wire to this list.

---

### FA-18 — Grade Settings Page Saves But Results Page Uses Hardcoded Fallback ⬜ PENDING
- **Where:** `src/pages/GradeSettings.jsx`, `src/pages/student/StudentResults.jsx:15`
- **Issue:** A full grade settings page exists where admin can configure grade ranges and points. However, `StudentResults.jsx` defines `DEFAULT_O_GRADES` and `DEFAULT_A_GRADES` as constants and only uses Firestore grades if `gradeSettings?.oLevel?.length` is truthy. If a grade is not yet configured in Firestore, the hardcoded defaults silently take over with no indication to the admin.
- **Fix:** On the grade settings page, show a warning banner if grade settings have not been configured yet. In StudentResults.jsx, prefer Firestore data exclusively once it's been saved.

---

### FA-19 — Prize Giving / Rankings Page Unverified ⬜ PENDING
- **Where:** `/prize-giving`
- **Issue:** Page exists but functionality (how rankings are calculated, what data drives them, what is printed) is unconfirmed.
- **Fix:** Review and confirm. Rankings should be calculated from real exam results data. Confirm export/print functionality.

---

### FA-20 — No Admin Interface for News Articles ⬜ PENDING
- **Where:** Admin sidebar / `/admin/news`
- **Issue:** News articles display on the public site but there is no confirmed, accessible admin interface for creating, editing, or deleting articles. The `/admin/news` route exists in App.jsx but may not appear in any navigation menu.
- **Fix:** Add "News" to the admin sidebar. Confirm `/admin/news` has full create/edit/delete functionality wired to Firestore.

---

### FA-21 — No Admin Interface for Staff Management ⬜ PENDING
- **Where:** Admin sidebar / `/admin/staff`
- **Issue:** Staff directory displays on the public site. `/admin/staff` is routed in App.jsx but it is unclear whether it is accessible and whether it has full CRUD (add staff, update profile, upload photo, deactivate).
- **Fix:** Add "Staff" to admin sidebar. Confirm CRUD operations work including photo upload to Firebase Storage.

---

### FA-22 — Expense Breakdown Pie Chart Uses Hardcoded Data ⬜ PENDING
- **Where:** `src/pages/bursar/BursarDashboard.jsx` (expenseData constant)
- **Issue:** The "Expense Breakdown" pie chart shows hardcoded `Salaries 42%, Utilities 14%...` regardless of what expenses have actually been recorded in Firestore.
- **Fix:** Group `expenses` collection by `category`, compute percentage of total. Wire to the chart. The `expenseByCategory` state already exists from the income statement work — use it here too.

---

### FA-23 — Income vs Expenses Trend Chart Uses Hardcoded Data ⬜ PENDING
- **Where:** `src/pages/bursar/BursarDashboard.jsx` (trendData constant)
- **Issue:** The "Income vs Expenses Trend" line chart shows hardcoded Term 1/2/3 values. The system has real receipt and expense data but it's not read here.
- **Fix:** Group receipts and expenses by term (using the `term` field on each document). Build the trend array dynamically. Fall back gracefully if only one term of data exists.

---

### FA-24 — Issue Receipt Dedicated Page Unverified ⬜ PENDING
- **Where:** `/bursar/issue-receipt`
- **Issue:** A dedicated "Issue Receipt" page exists separate from "Receive Payment". Whether this is for reprint of existing receipts or a new receipt flow is unconfirmed.
- **Fix:** Confirm purpose. If reprint: wire to `receipts` collection with search by receipt number or student reg. If duplicate of Receive Payment: consolidate or remove.

---

### FA-25 — Budget Overview Page Unverified ⬜ PENDING
- **Where:** `/bursar/budget`
- **Issue:** Page exists. Whether it shows planned vs actual budget, just expense list, or something else is unconfirmed.
- **Fix:** Review and confirm. At minimum it should list all recorded expenses. Ideally it should allow setting a budget per category and comparing to actuals.

---

### FA-26 — Expense Categories Management Unverified ⬜ PENDING
- **Where:** `/bursar/expense-categories`
- **Issue:** Page exists. Whether it allows custom category creation (beyond the hardcoded list in RecordExpense.jsx) is unconfirmed.
- **Fix:** If functional, the categories saved here should drive the dropdown in `RecordExpense.jsx` instead of the hardcoded `CATEGORIES` array. Wire them together.

---

### FA-27 — Income Statement Full Page Unverified ⬜ PENDING
- **Where:** `/bursar/income-statement`
- **Issue:** A dashboard summary exists. The full dedicated page should show a complete income statement with all income lines, all expense categories, net surplus, and a date range filter.
- **Fix:** Review and confirm the full page is wired to real Firestore data. Add term/date filter. Add print/export to PDF.

---

### FA-28 — Balance Sheet Full Page Unverified ⬜ PENDING
- **Where:** `/bursar/balance-sheet`
- **Issue:** Dashboard summary exists. Full page should show complete assets and liabilities with drill-down.
- **Fix:** Review and confirm. Add "as at" date. Add print/export.

---

### FA-29 — Collection Report Page Unverified ⬜ PENDING
- **Where:** `/bursar/collection-report`
- **Issue:** Page exists. Whether it generates a per-student, per-class, or aggregate collection report is unconfirmed.
- **Fix:** Review and confirm. Should show total collected, by payment method, by class, filterable by date range. Add CSV/PDF export.

---

### FA-30 — Print Reports Page Unverified ⬜ PENDING
- **Where:** `/bursar/print-reports`
- **Issue:** Page exists. Purpose and what reports it prints are unconfirmed.
- **Fix:** Review and confirm. Should centralise all printable financial reports in one place.

---

### FA-31 — POP Reviewer Cannot Send Rejection Reason to Student ⬜ PENDING
- **Where:** Bursar POP review page
- **Issue:** Bursar can approve or reject a proof of payment but there is no text field for a rejection reason. The student sees "Rejected" with no explanation, leaving them unable to know what to fix.
- **Fix:** Add a `rejectionReason` text input when rejecting. Save it to the `proofOfPayments` document. Display it in the student's upload history in `StudentFees.jsx`.

---

### FA-32 — Security Logs Display Page Unverified ⬜ PENDING
- **Where:** `/webadmin/SecurityLogs` (or similar path)
- **Issue:** Security events are logged to Firestore by `logSecurityEvent.js` but whether the display page renders them correctly (with filters, timestamps, severity) is unconfirmed.
- **Fix:** Review the page. Confirm it reads from the `securityLogs` or `loginAttempts` collection. Add filters by event type, date range, and student ID.

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

### FA-43 — Student Can Submit Multiple Exeat Applications Concurrently ⬜ PENDING
- **Where:** `src/pages/student/ExeatApplicationForm.jsx`
- **Issue:** No check prevents a student from submitting a second exeat application while one is still pending approval. Admin gets duplicate pending requests with no automatic flag.
- **Fix:** Before allowing form submission, query for existing `status: 'pending'` or `status: 'approved'` exeat applications for the student. Block with a clear message if one already exists.

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
| Public Website | 10 | 8 | 1 | 1 | 0 |
| Authentication | 7 | 5 | 2 | 0 | 0 |
| Student Portal | 13 | 9 | 3 | 1 | 0 |
| Admin Portal | 21 | 8 | 3 | 2 | 8 |
| Bursar Portal | 20 | 12 | 3 | 2 | 3 |
| Web Admin | 4 | 3 | 0 | 0 | 1 |
| **Total** | **75** | **45** | **12** | **6** | **12** |

---

## Recommended Fix Order

**Immediate (data loss / misleading admin):**
1. FA-02 — Contact form actually saves/emails submissions
2. FA-12 — End-of-term shows real pre-flight numbers, not mock
3. FA-22 — Expense pie chart wired to real data
4. FA-23 — Income/expense trend wired to real data

**High value (core workflows):**
5. FA-31 — POP rejection reason sent to student
6. FA-18 — Grade settings page linked to results display
7. FA-06 — Notifications page and unread badge
8. FA-03 / FA-04 — Exeat history and clearance status confirmed working

**Unverified pages (review and confirm or fix):**
9. FA-08 through FA-17, FA-24 through FA-30, FA-32 — audit each page

**New features (roadmap):**
10. FA-33 — Attendance tracking
11. FA-37 — Teacher portal
12. FA-34 — Guardian communication
13. FA-40 — Bulk notification system
14. FA-42 — CSV/PDF export on all reports
