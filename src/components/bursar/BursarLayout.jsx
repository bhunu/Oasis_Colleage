import { useState } from 'react'
import BursarSidebar from './BursarSidebar'
import BursarTopbar  from './BursarTopbar'

export default function BursarLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#0A1628] overflow-hidden font-sans">
      <BursarSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-[210px] min-w-0 overflow-hidden">
        <BursarTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
