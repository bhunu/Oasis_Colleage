# Oasis College Student Records Admin Dashboard

Complete Student Records Admin system built with React, Vite, Tailwind CSS, and Firebase Firestore.

## Setup & Installation

### 1. Install Dependencies

Open the terminal in VS Code and run:

```bash
npm install
```

This will install all required packages including:
- `react-firebase-hooks` - Firebase authentication hooks
- `recharts` - Dashboard charts and graphs
- `tabler-icons-react` - Icon library

### 2. Environment Variables

Firebase configuration is already set in `src/firebase/config.js`:
- Project: oasis-818f2
- API Key: AIzaSyD0XU3EbtEvTBnQW88-DJfDR9pDGF7wNJU
- Auth Domain: oasis-818f2.firebaseapp.com

### 3. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Application Structure

### Authentication Flow
1. **Root `/`** - LoginRedirect component
   - If user is logged in → Redirects to `/dashboard`
   - If user is not logged in → Shows existing Login modal
   
2. **Protected Routes** - All dashboard routes wrapped with ProtectedRoute
   - If no active session → Redirects to `/`
   - If loading auth → Shows spinner
   - If authenticated → Renders page

### Dashboard Routes

#### Overview
- `/dashboard` - Dashboard with stats, charts, and quick actions

#### Students
- `/enrol` - Enrol new students (auto-generates Registration IDs)
- `/students` - Student records view
- `/registration` - Registration ID management

#### Academics
- `/coursework` - Coursework marks entry
- `/exams` - End of term exams
- `/reports` - Academic reports

#### Finance
- `/fees` - Fee accounts and payment tracking
- `/arrears` - Outstanding fees tracking
- `/payments` - Payment history
- `/end-of-term` - End of term procedure (Term closing)

#### System
- `/student-portal` - Student account ledger view
- `/settings` - System configuration

## Key Components

### Layout Components
- **Layout.jsx** - Main dashboard wrapper with Sidebar and Topbar
- **Sidebar.jsx** - Navigation menu with icons and active states
- **Topbar.jsx** - Page header with admin info and notifications
- **ProtectedRoute.jsx** - Route protection with auth check

### Reusable Components
- **StatCard.jsx** - Dashboard statistics cards
- **StepTracker.jsx** - End of term procedure progress tracker
- **ProgressModal.jsx** - Modal showing real-time procedure progress
- **ConfirmModal.jsx** - Confirmation dialogs
- **PaymentModal.jsx** - Add payment to fee account
- **LedgerTable.jsx** - Student account ledger display

### Pages
- **Dashboard.jsx** - Live stats, charts (Recharts), and tables
- **Enrol.jsx** - Student enrollment form with auto ID generation
- **Fees.jsx** - Fee account search and payment management
- **EndOfTerm.jsx** - Complex end of term closing procedure
- **StudentPortal.jsx** - Student ledger view
- Plus stub pages for other sections

## Dashboard Features

### 1. Dashboard Page
- **4 Live Stats Cards**: Total students, fees paid, arrears, marks uploaded
- **Quick Action Buttons**: Navigate to key sections
- **Charts**:
  - Fees arrears by class (horizontal bar chart)
  - Payment status (doughnut chart)
  - Arrears trend by year (line chart)
  - Marks upload progress (vertical bar chart)
- **Tables**:
  - Recent enrolments (last 5)
  - Top arrears students (top 5)

### 2. Student Enrolment
- Full form with personal, guardian, and enrollment info
- Auto-generates unique Registration ID: `OC-YYYY-XXXX`
- Creates opening fee account automatically
- Success screen with ID and print option

### 3. Fees Management
- Search students by name or ID
- View detailed account information
- Add payments and charges
- Balance tracking (debit/credit/nil)

### 4. End of Term Procedure
- **5-Step Progress Tracker**:
  1. Verify all payments
  2. Lock term accounts
  3. Calculate balances c/d
  4. Post balances b/d
  5. Open new term

- **Settings Panel**: Configure closing/opening terms
- **Live Summary Stats**: Total accounts, nil balance, arrears, credits
- **Account Preview**: First 10 accounts being closed
- **Double Entry Preview**: Sample closing → opening entries
- **Progress Modal**: Real-time procedure execution with log
- **Confirmation Dialog**: Prevents accidental closure

### 5. Student Portal
- Student account ledger with transaction history
- Debit/credit/balance tracking
- Outstanding balance highlighted in red

## Firestore Collections

Collections to set up in Firebase:

```
feeAccounts/
  {studentId_termId}: {
    studentId, studentName, class, term,
    status, totalCharged, totalPaid, balance,
    balanceType, balanceBD, transactions
  }

students/
  {id}: {
    registrationId, fullName, dateOfBirth, gender,
    class, guardianName, guardianPhone, guardianEmail,
    homeAddress, enrolmentDate, studentType, createdAt
  }

termPeriods/
  {number-year}: {
    number, year, status, startDate, closedAt, createdAt
  }

marksRecords/
  {id}: { classId, uploadedAt, percentage, teacher }

termTransactions/
  {id}: { studentId, term, date, description, debit, credit }

closingStatements/
  {id}: { studentId, term, closingBalance, balanceType, generatedAt }

adminUsers/
  {uid}: { email, displayName, role, createdAt }

procedureLogs/
  {id}: { term, processedAccounts, errors, completedAt }
```

## Styling

- **Tailwind CSS** for all styling
- **Primary Color**: `#185FA5` (blue)
- **Secondary Colors**: Green (`#10B981`), Red (`#EF4444`), Amber (`#F59E0B`)
- **Icons**: Tabler Icons for consistent icon set

## Authentication

Uses Firebase Auth with `react-firebase-hooks`:
- `useAuthState(auth)` - Get current user and loading state
- `signOut(auth)` - Logout functionality (sidebar button)
- Sidebar logout button redirects to `/` after signout

## Notes

- Dashboard loads immediately after successful Firebase Auth login
- All dates use ISO format (YYYY-MM-DD)
- End of term procedure is complex but fully reversible until confirmed
- Charts use Recharts library with custom colors
- Responsive design for all screen sizes
- Toast notifications for user feedback

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Production Deployment

1. Run `npm run build`
2. Deploy the `dist/` folder to your hosting
3. Ensure Firebase configuration is valid
4. Set up Firestore security rules for production

---

**Created**: May 28, 2025  
**Framework**: React + Vite  
**Styling**: Tailwind CSS  
**Backend**: Firebase (Auth + Firestore + Storage)
