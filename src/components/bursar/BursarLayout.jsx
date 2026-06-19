import { useState } from 'react'
import BursarSidebar from './BursarSidebar'
import BursarTopbar  from './BursarTopbar'

export default function BursarLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 1024) {
      setCollapsed(c => !c)
    } else {
      setSidebarOpen(o => !o)
    }
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-navy overflow-hidden font-sans">
      <BursarSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <BursarTopbar onMenuClick={handleSidebarToggle} collapsed={collapsed} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className={collapsed ? 'max-w-7xl mx-auto [&>*]:mx-auto' : ''}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
