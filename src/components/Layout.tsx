import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  ShoppingCart, Package, ClipboardList, Database, Users,
  LogOut, Menu, X, CreditCard, QrCode,
} from 'lucide-react'
import { getCurrentUser, logout } from '@/services/auth'
import { isAdmin } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'POS',          href: '/',                  icon: ShoppingCart,  adminOnly: false },
  { label: 'Products',     href: '/admin/products',     icon: Package,       adminOnly: true },
  { label: 'Orders',       href: '/admin/orders',       icon: ClipboardList, adminOnly: true },
  { label: 'Pay Later',    href: '/admin/pay-later',    icon: CreditCard,    adminOnly: true },
  { label: 'Stock',        href: '/admin/stock',        icon: Database,      adminOnly: true },
  { label: 'Bank QR',      href: '/admin/bank-qr',      icon: QrCode,        adminOnly: true },
  { label: 'Users',        href: '/admin/users',        icon: Users,         adminOnly: true },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const user = getCurrentUser()
  const admin = isAdmin()

  const close = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen bg-background">

      {/* ── Mobile top bar ─────────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 border-b bg-card flex items-center px-4 gap-3 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-bold text-base tracking-tight">POS System</span>
      </header>

      {/* ── Mobile backdrop ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 w-64 flex flex-col border-r bg-card transition-transform duration-200 ease-in-out',
          'lg:static lg:w-56 lg:translate-x-0 lg:shrink-0',
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg tracking-tight">POS System</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Point of Sale</p>
          </div>
          <button
            onClick={close}
            className="lg:hidden p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => !item.adminOnly || admin)
            .map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={close}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="p-4 border-t">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize mb-3">{user?.role}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">
        <Outlet />
      </main>

    </div>
  )
}
