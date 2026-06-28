import { getCurrentUser } from '@/services/auth'

export function isAdmin(): boolean {
  return getCurrentUser()?.role === 'admin'
}
