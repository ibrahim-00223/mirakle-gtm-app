'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  href: string
  icon: LucideIcon
  label: string
  collapsed?: boolean
}

export function SidebarItem({ href, icon: Icon, label, collapsed }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  if (collapsed) {
    return (
      <Link
        href={href}
        title={label}
        className={cn(
          'flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-150',
          isActive
            ? 'bg-[rgba(0,102,255,0.15)] text-[#0066FF]'
            : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'text-white bg-[rgba(0,102,255,0.15)] border-l-2 border-[#0066FF] pl-[calc(0.75rem-2px)]'
          : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent pl-[calc(0.75rem-2px)]'
      )}
    >
      <Icon
        className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#0066FF]' : 'text-slate-500')}
      />
      <span className="truncate">{label}</span>
    </Link>
  )
}
