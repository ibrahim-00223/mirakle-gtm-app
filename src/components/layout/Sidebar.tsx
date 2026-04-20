'use client'

import { Home, Target, BarChart2, Building2, Users, BookOpen } from 'lucide-react'
import { SidebarItem } from './SidebarItem'

const navItems = [
  { href: '/home', icon: Home, label: 'Accueil' },
  { href: '/campagnes', icon: Target, label: 'Campagnes' },
  { href: '/dashboard', icon: BarChart2, label: 'Dashboard' },
  { href: '/entreprises', icon: Building2, label: 'Entreprises' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/docs', icon: BookOpen, label: 'Documentation' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col bg-[#0A1628] border-r border-white/[0.06] z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0066FF] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs font-heading">M</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm font-heading leading-tight">Mirakl GTM</p>
            <p className="text-slate-500 text-[10px] leading-tight">Sales Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#0066FF]/20 flex items-center justify-center">
            <span className="text-[#0066FF] text-xs font-bold">BD</span>
          </div>
          <div>
            <p className="text-white text-xs font-medium">BDR Team</p>
            <p className="text-slate-500 text-[10px]">Mirakle Sales</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
