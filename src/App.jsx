import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
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
import Login from './pages/Login'
import Users from './pages/Users'
import AdminRoute from './components/admin/AdminRoute'
import AdminLayout from './components/admin/Layout'

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
  const location  = useLocation()
  const isAdmin   = location.pathname.startsWith('/admin')
  const isLogin   = location.pathname === '/login'

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

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" />
      <ScrollToTop />
      {!isLogin && <Navbar />}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"           element={<PageWrapper><Home       /></PageWrapper>} />
            <Route path="/about"      element={<PageWrapper><About      /></PageWrapper>} />
            <Route path="/academics"  element={<PageWrapper><Academics  /></PageWrapper>} />
            <Route path="/admissions" element={<PageWrapper><Admissions /></PageWrapper>} />
            <Route path="/campus-life" element={<PageWrapper><CampusLife /></PageWrapper>} />
            <Route path="/calendar"   element={<PageWrapper><Calendar   /></PageWrapper>} />
            <Route path="/gallery"    element={<PageWrapper><Gallery    /></PageWrapper>} />
            <Route path="/staff"      element={<PageWrapper><Staff      /></PageWrapper>} />
            <Route path="/news"       element={<PageWrapper><News       /></PageWrapper>} />
            <Route path="/contact"    element={<PageWrapper><Contact    /></PageWrapper>} />
            <Route path="/login"      element={<Login />} />
            <Route path="/users"      element={<PageWrapper><Users      /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isLogin && <Footer />}
    </div>
  )
}
