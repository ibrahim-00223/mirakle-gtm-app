'use client'

import { LayoutDashboard, Megaphone, Building2, Target, UserSearch, ChevronLeft, ChevronRight } from 'lucide-react'
import { SidebarItem } from './SidebarItem'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/campagnes', icon: Megaphone, label: 'Campagnes' },
  { href: '/entreprises', icon: Building2, label: 'Entreprises' },
  { href: '/matching', icon: Target, label: 'Matching' },
  { href: '/enrichissement', icon: UserSearch, label: 'Enrichissement' },
]

export function Sidebar() {
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full flex flex-col bg-[#03182F] border-r border-white/[0.08] z-40 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo + toggle */}
      <div className={cn('border-b border-white/[0.08] flex items-center', collapsed ? 'px-3 py-5 justify-center' : 'px-5 py-5 justify-between')}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#2764FF] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">Mirakl GTM</p>
              <p className="text-white/40 text-[10px] leading-tight">Sales Intelligence</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all shrink-0"
            title="Réduire la sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 mb-2">
            Navigation
          </p>
        )}
        {navItems.map((item) => (
          <SidebarItem key={item.href} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-white/[0.08]', collapsed ? 'px-2 py-4 flex justify-center' : 'px-5 py-4')}>
        {collapsed ? (
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Agrandir la sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#2764FF]/20 flex items-center justify-center shrink-0">
              <span className="text-[#2764FF] text-xs font-bold">BD</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium">BDR Team</p>
              <p className="text-white/40 text-[10px]">Mirakle Sales</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
