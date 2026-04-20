'use client'

import { Home, Target, BarChart2, Building2, Users, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { SidebarItem } from './SidebarItem'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home', icon: Home, label: 'Accueil' },
  { href: '/campagnes', icon: Target, label: 'Campagnes' },
  { href: '/dashboard', icon: BarChart2, label: 'Dashboard' },
  { href: '/entreprises', icon: Building2, label: 'Entreprises' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/docs', icon: BookOpen, label: 'Documentation' },
]

export function Sidebar() {
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full flex flex-col bg-[#0A1628] border-r border-white/[0.06] z-40 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo + toggle */}
      <div className={cn('border-b border-white/[0.06] flex items-center', collapsed ? 'px-3 py-5 justify-center' : 'px-5 py-5 justify-between')}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#0066FF] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs font-heading">M</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm font-heading leading-tight truncate">Mirakl GTM</p>
              <p className="text-slate-500 text-[10px] leading-tight">Sales Intelligence</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all shrink-0"
            title="Réduire la sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
            Navigation
          </p>
        )}
        {navItems.map((item) => (
          <SidebarItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-white/[0.06]', collapsed ? 'px-2 py-4 flex justify-center' : 'px-5 py-4')}>
        {collapsed ? (
          /* Expand button when collapsed */
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
            title="Agrandir la sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#0066FF]/20 flex items-center justify-center shrink-0">
              <span className="text-[#0066FF] text-xs font-bold">BD</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium">BDR Team</p>
              <p className="text-slate-500 text-[10px]">Mirakle Sales</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
