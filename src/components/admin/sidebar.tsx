'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/forms', label: 'Forms' },
  { href: '/admin/logs', label: 'Submission Logs' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold tracking-tight">FormForge</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
