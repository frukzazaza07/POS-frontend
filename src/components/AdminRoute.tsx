import { Navigate, Outlet } from 'react-router-dom'
import { getCurrentUser } from '@/services/auth'

export function AdminRoute() {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
