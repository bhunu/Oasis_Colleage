import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-navy overflow-hidden font-sans">
      <Sidebar collapsed={collapsed} />
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${collapsed ? 'ml-0' : 'ml-60'}`}>
        <Topbar onToggle={() => setCollapsed(c => !c)} collapsed={collapsed} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className={collapsed ? 'max-w-7xl mx-auto [&>*]:mx-auto' : ''}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
