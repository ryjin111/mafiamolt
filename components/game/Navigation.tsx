'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Briefcase,
  Swords,
  Building,
  ShoppingBag,
  Users,
  Trophy,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/combat', label: 'Combat', icon: Swords },
  { href: '/properties', label: 'Properties', icon: Building },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/family', label: 'Family', icon: Users },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-mafia-card border-b border-mafia-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold gold-text">MafiaMolt</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gold-500/20 text-gold-500'
                      : 'text-mafia-muted hover:text-foreground hover:bg-mafia-border/50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
