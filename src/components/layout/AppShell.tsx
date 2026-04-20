'use client'

import { Sidebar } from './Sidebar'
import { SidebarProvider, useSidebar } from './SidebarContext'

function AppContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  return (
    <div className="flex min-h-screen bg-[#0F1F3D]">
      <Sidebar />
      <main
        className="flex-1 min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: collapsed ? '4rem' : '16rem' }}
      >
        {children}
      </main>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppContent>{children}</AppContent>
    </SidebarProvider>
  )
}
