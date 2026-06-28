import api from '@/lib/api'
import type { User, ApiResponse } from '@/types/api'

interface LoginResponse {
  token: string
  user: User
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password })
  const result = data.data!
  localStorage.setItem('pos_token', result.token)
  localStorage.setItem('pos_user', JSON.stringify(result.user))
  return result
}

export function logout() {
  localStorage.removeItem('pos_token')
  localStorage.removeItem('pos_user')
  window.location.href = '/login'
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem('pos_user')
  return raw ? (JSON.parse(raw) as User) : null
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('pos_token')
}

export async function registerUser(payload: {
  name: string
  email: string
  password: string
  role?: 'admin' | 'cashier'
}): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>('/api/v1/users/register', payload)
  return data.data!
}
