import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
// Teacher portal imports
import TeacherProtectedRoute from './components/auth/TeacherProtectedRoute'
import TeacherLayout         from './pages/teacher/TeacherLayout'
import TeacherDashboard      from './pages/teacher/TeacherDashboard'
import TeacherTimetable      from './pages/teacher/TeacherTimetable'
import TeacherAttendance     from './pages/teacher/TeacherAttendance'
import TeacherAnnouncements  from './pages/teacher/TeacherAnnouncements'
import TeacherPerformance    from './pages/teacher/TeacherPerformance'
import TeacherMaterials      from './pages/teacher/TeacherMaterials'
// Bursar imports
import BursarProtectedRoute from './components/auth/BursarProtectedRoute'
import BursarLayout         from './components/bursar/BursarLayout'
import BursarDashboard      from './pages/bursar/BursarDashboard'
import ReceivePayment       from './pages/bursar/ReceivePayment'
import IssueReceipt         from './pages/bursar/IssueReceipt'
import BursarStudentAccounts from './pages/bursar/BursarStudentAccounts'
import BursarArrears        from './pages/bursar/BursarArrears'
import BudgetOverview       from './pages/bursar/BudgetOverview'
import RecordExpense        from './pages/bursar/RecordExpense'
import ExpenseCategories    from './pages/bursar/ExpenseCategories'
import IncomeStatement      from './pages/bursar/IncomeStatement'
import BalanceSheet         from './pages/bursar/BalanceSheet'
import CollectionReport     from './pages/bursar/CollectionReport'
import PrintReports         from './pages/bursar/PrintReports'
import BursarSettings       from './pages/bursar/BursarSettings'
import ReviewPOP            from './pages/bursar/ReviewPOP'
// Student portal imports
import { StudentProvider }  from './context/StudentContext'
import StudentProtectedRoute, { StudentAuthRoute, BoarderRoute } from './components/auth/StudentProtectedRoute'
import StudentLayout        from './pages/student/StudentLayout'
import StudentDashboard     from './pages/student/StudentDashboard'
import StudentResults       from './pages/student/StudentResults'
import StudentFees          from './pages/student/StudentFees'
import StudentProfile       from './pages/student/StudentProfile'
import StudentUploadPOP     from './pages/student/StudentUploadPOP'
import StudentNotifications from './pages/student/StudentNotifications'
import StudentMaterials     from './pages/student/StudentMaterials'
import SetupPassword        from './pages/student/SetupPassword'
// Web-admin pages
import StudentOTPManager    from './pages/webadmin/StudentOTPManager'
import Footer from './components/Footer'
import { Navigate } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import About from './pages/About'
import Academics from './pages/Academics'
import Admissions from './pages/Admissions'
import CampusLife from './pages/CampusLife'
import Calendar from './pages/Calendar'
import Gallery from './pages/Gallery'
import Staff from './pages/Staff'
import News from './pages/News'
import Contact from './pages/Contact'
import Login             from './pages/Login'
import StaffLogin        from './pages/StaffLogin'
import StaffPortalSelect from './pages/StaffPortalSelect'
import AdminTimetable    from './pages/admin/Timetable'
import AdminExamTimetable from './pages/admin/ExamTimetable'
import Users from './pages/Users'
import AdminRoute from './components/admin/AdminRoute'
import AdminLayout from './components/admin/Layout'

// Admin Dashboard Imports
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginRedirect from './components/LoginRedirect'
import Dashboard from './pages/Dashboard'
import Enrol from './pages/Enrol'
import Students from './pages/Students'
import Registration from './pages/Registration'
import Exams from './pages/Exams'
import Reports from './pages/Reports'
import Fees from './pages/Fees'
import Arrears from './pages/Arrears'
import Payments from './pages/Payments'
import EndOfTerm from './pages/EndOfTerm'
import StudentPortal from './pages/StudentPortal'
import Settings from './pages/Settings'
import Subjects from './pages/Subjects'
import AccessPassPage from './pages/AccessPassPage'
import ExeatManagementPage from './pages/ExeatManagementPage'
import ClassPerformancePage from './pages/admin/ClassPerformancePage'
import PrizeGivingPage      from './pages/admin/PrizeGivingPage'
import Classes from './pages/Classes'
import GradeSettings from './pages/GradeSettings'
import ExeatApplicationForm      from './pages/student/ExeatApplicationForm'
import MyExeatApplications       from './pages/student/MyExeatApplications'
import TransferRequestForm        from './pages/student/TransferRequestForm'
import ClearanceApplicationForm   from './pages/student/ClearanceApplicationForm'
import MyClearanceStatus          from './pages/student/MyClearanceStatus'
import StudentTimetable           from './pages/student/StudentTimetable'
import ClearanceManagementPage    from './pages/ClearanceManagementPage'
import VerifyClearancePage        from './pages/VerifyClearancePage'
import VerifyBalancePage          from './pages/VerifyBalancePage'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } },
}

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const location  = useLocation()
  const isAdmin   = location.pathname.startsWith('/admin')
  const isDashboard = location.pathname.startsWith('/dashboard') ||
                     location.pathname.startsWith('/enrol') ||
                     location.pathname.startsWith('/students') ||
                     location.pathname.startsWith('/registration') ||
                     location.pathname.startsWith('/exams') ||
                     location.pathname.startsWith('/reports') ||
                     location.pathname.startsWith('/fees') ||
                     location.pathname.startsWith('/arrears') ||
                     location.pathname.startsWith('/payments') ||
                     location.pathname.startsWith('/end-of-term') ||
                     location.pathname.startsWith('/student-portal') ||
                     location.pathname.startsWith('/settings') ||
                     location.pathname.startsWith('/subjects') ||
                     location.pathname.startsWith('/otp-manager') ||
                     location.pathname.startsWith('/access-pass') ||
                     location.pathname.startsWith('/exeat') ||
                     location.pathname.startsWith('/clearance') ||
                     location.pathname.startsWith('/class-performance') ||
                     location.pathname.startsWith('/classes') ||
                     location.pathname.startsWith('/grade-settings') ||
                     location.pathname.startsWith('/prize-giving') ||
                     location.pathname.startsWith('/timetable') ||
                     location.pathname.startsWith('/exam-timetable') ||
                     location.pathname === '/users'
  const isLogin   = location.pathname === '/login' || location.pathname === '/staff-login' || location.pathname === '/staff-portal'
  const isBursar  = location.pathname.startsWith('/bursar')
  const isTeacher = location.pathname.startsWith('/teacher')
  const isStudent = location.pathname.startsWith('/student/')

  if (loading) return <Preloader onDone={() => setLoading(false)} />

  if (isStudent) {
    return (
      <StudentProvider>
        <Toaster position="top-right" />
        <Routes location={location} key={location.pathname}>
          <Route path="/student/setup-password" element={<StudentAuthRoute><SetupPassword /></StudentAuthRoute>} />
          <Route path="/student/dashboard"  element={<StudentProtectedRoute><StudentLayout><StudentDashboard /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/results"    element={<StudentProtectedRoute><StudentLayout><StudentResults /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/fees"       element={<StudentProtectedRoute><StudentLayout><StudentFees /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/profile"    element={<StudentProtectedRoute><StudentLayout><StudentProfile /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/upload-pop"            element={<StudentProtectedRoute><StudentLayout><StudentUploadPOP /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/exeat/apply"           element={<BoarderRoute><StudentLayout><ExeatApplicationForm /></StudentLayout></BoarderRoute>} />
          <Route path="/student/exeat/my-applications" element={<BoarderRoute><StudentLayout><MyExeatApplications /></StudentLayout></BoarderRoute>} />
          <Route path="/student/transfer"              element={<StudentProtectedRoute><StudentLayout><TransferRequestForm /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/clearance/apply"       element={<StudentProtectedRoute><StudentLayout><ClearanceApplicationForm /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/clearance/status"      element={<StudentProtectedRoute><StudentLayout><MyClearanceStatus /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/notifications"         element={<StudentProtectedRoute><StudentLayout><StudentNotifications /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/materials"             element={<StudentProtectedRoute><StudentLayout><StudentMaterials /></StudentLayout></StudentProtectedRoute>} />
          <Route path="/student/timetable"             element={<StudentProtectedRoute><StudentLayout><StudentTimetable /></StudentLayout></StudentProtectedRoute>} />
        </Routes>
      </StudentProvider>
    )
  }

  if (isTeacher) {
    return (
      <>
        <Toaster position="top-right" />
        <TeacherProtectedRoute>
          <Routes location={location} key={location.pathname}>
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index                   element={<TeacherDashboard />} />
              <Route path="dashboard"        element={<TeacherDashboard />} />
              <Route path="timetable"        element={<TeacherTimetable />} />
              <Route path="attendance"       element={<TeacherAttendance />} />
              <Route path="announcements"    element={<TeacherAnnouncements />} />
              <Route path="performance"      element={<TeacherPerformance />} />
              <Route path="materials"        element={<TeacherMaterials />} />
            </Route>
          </Routes>
        </TeacherProtectedRoute>
      </>
    )
  }

  if (isBursar) {
    return (
      <>
        <Toaster position="top-right" />
        <Routes location={location} key={location.pathname}>
          <Route path="/bursar/dashboard"          element={<BursarProtectedRoute><BursarLayout><BursarDashboard /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/receive-payment"    element={<BursarProtectedRoute><BursarLayout><ReceivePayment /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/issue-receipt"      element={<BursarProtectedRoute><BursarLayout><IssueReceipt /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/student-accounts"   element={<BursarProtectedRoute><BursarLayout><BursarStudentAccounts /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/arrears"            element={<BursarProtectedRoute><BursarLayout><BursarArrears /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/budget"             element={<BursarProtectedRoute><BursarLayout><BudgetOverview /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/record-expense"     element={<BursarProtectedRoute><BursarLayout><RecordExpense /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/expense-categories" element={<BursarProtectedRoute><BursarLayout><ExpenseCategories /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/income-statement"   element={<BursarProtectedRoute><BursarLayout><IncomeStatement /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/balance-sheet"      element={<BursarProtectedRoute><BursarLayout><BalanceSheet /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/collection-report"  element={<BursarProtectedRoute><BursarLayout><CollectionReport /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/print-reports"      element={<BursarProtectedRoute><BursarLayout><PrintReports /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/settings"           element={<BursarProtectedRoute><BursarLayout><BursarSettings /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/review-pop"         element={<BursarProtectedRoute><BursarLayout><ReviewPOP /></BursarLayout></BursarProtectedRoute>} />
          <Route path="/bursar/end-of-term"         element={<BursarProtectedRoute><BursarLayout><EndOfTerm /></BursarLayout></BursarProtectedRoute>} />
        </Routes>
      </>
    )
  }

  if (isAdmin) {
    return (
      <>
        <Toaster position="top-right" />
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      </>
    )
  }

  if (isDashboard) {
    return (
      <>
        <Toaster position="top-right" />
        <Routes location={location} key={location.pathname}>
          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          }/>
          <Route path="/enrol" element={
            <ProtectedRoute><Layout><Enrol /></Layout></ProtectedRoute>
          }/>
          <Route path="/students" element={
            <ProtectedRoute><Layout><Students /></Layout></ProtectedRoute>
          }/>
          <Route path="/registration" element={
            <ProtectedRoute><Layout><Registration /></Layout></ProtectedRoute>
          }/>
          <Route path="/exams" element={
            <ProtectedRoute><Layout><Exams /></Layout></ProtectedRoute>
          }/>
          <Route path="/reports" element={
            <ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>
          }/>
          <Route path="/fees" element={
            <ProtectedRoute><Layout><Fees /></Layout></ProtectedRoute>
          }/>
          <Route path="/arrears" element={
            <ProtectedRoute><Layout><Arrears /></Layout></ProtectedRoute>
          }/>
          <Route path="/payments" element={
            <ProtectedRoute><Layout><Payments /></Layout></ProtectedRoute>
          }/>
          <Route path="/end-of-term" element={
            <ProtectedRoute><Layout><EndOfTerm /></Layout></ProtectedRoute>
          }/>
          <Route path="/student-portal" element={
            <ProtectedRoute><Layout><StudentPortal /></Layout></ProtectedRoute>
          }/>
          <Route path="/settings" element={
            <ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>
          }/>
          <Route path="/subjects" element={
            <ProtectedRoute><Layout><Subjects /></Layout></ProtectedRoute>
          }/>
          <Route path="/otp-manager" element={
            <ProtectedRoute><Layout><StudentOTPManager /></Layout></ProtectedRoute>
          }/>
          <Route path="/access-pass" element={
            <ProtectedRoute><Layout><AccessPassPage /></Layout></ProtectedRoute>
          }/>
          <Route path="/exeat" element={
            <ProtectedRoute><Layout><ExeatManagementPage /></Layout></ProtectedRoute>
          }/>
          <Route path="/clearance" element={
            <ProtectedRoute><Layout><ClearanceManagementPage /></Layout></ProtectedRoute>
          }/>
          <Route path="/class-performance" element={
            <ProtectedRoute><Layout><ClassPerformancePage /></Layout></ProtectedRoute>
          }/>
          <Route path="/classes" element={
            <ProtectedRoute><Layout><Classes /></Layout></ProtectedRoute>
          }/>
          <Route path="/grade-settings" element={
            <ProtectedRoute><Layout><GradeSettings /></Layout></ProtectedRoute>
          }/>
          <Route path="/prize-giving" element={
            <ProtectedRoute><Layout><PrizeGivingPage /></Layout></ProtectedRoute>
          }/>
          <Route path="/timetable" element={
            <ProtectedRoute><Layout><AdminTimetable /></Layout></ProtectedRoute>
          }/>
          <Route path="/exam-timetable" element={
            <ProtectedRoute><Layout><AdminExamTimetable /></Layout></ProtectedRoute>
          }/>
          <Route path="/users" element={
            <ProtectedRoute><Users /></ProtectedRoute>
          }/>
        </Routes>
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" />
      <ScrollToTop />
      {!isLogin && <Navbar />}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"            element={<PageWrapper><Home       /></PageWrapper>} />
            <Route path="/home"        element={<PageWrapper><Home       /></PageWrapper>} />
            <Route path="/about"       element={<PageWrapper><About      /></PageWrapper>} />
            <Route path="/academics"   element={<PageWrapper><Academics  /></PageWrapper>} />
            <Route path="/admissions"  element={<PageWrapper><Admissions /></PageWrapper>} />
            <Route path="/campus-life" element={<PageWrapper><CampusLife /></PageWrapper>} />
            <Route path="/calendar"    element={<PageWrapper><Calendar   /></PageWrapper>} />
            <Route path="/gallery"     element={<PageWrapper><Gallery    /></PageWrapper>} />
            <Route path="/staff"       element={<PageWrapper><Staff      /></PageWrapper>} />
            <Route path="/news"        element={<PageWrapper><News       /></PageWrapper>} />
            <Route path="/contact"     element={<PageWrapper><Contact    /></PageWrapper>} />
            <Route path="/login"         element={<Login />} />
            <Route path="/staff-portal" element={<StaffPortalSelect />} />
            <Route path="/staff-login"  element={<StaffLogin />} />
            <Route path="/verify/:clearanceSerial" element={<VerifyClearancePage />} />
            <Route path="/verify-balance/:regNumber" element={<VerifyBalancePage />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isLogin && <Footer />}
    </div>
  )
}
