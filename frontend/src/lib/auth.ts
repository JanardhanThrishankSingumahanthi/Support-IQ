export type AuthUser = {
  id: number
  email: string
  full_name: string
  role: string | null
  permissions: string[]
  is_active: boolean
}

export type AuthSession = {
  token: string
  expires_in_minutes: number
  user: AuthUser
}

export type AuthResponse = {
  status: string
  message: string
  token?: string
  user?: AuthUser
  expires_in_minutes?: number
}

const AUTH_STORAGE_KEY = 'supportiq_auth_session'

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AuthSession
    if (!session?.token || !session?.user) return null
    return session
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false
  if (user.role === 'Administrator') return true
  return user.permissions.includes(permission)
}

export function hasRole(user: AuthUser | null, role: string): boolean {
  if (!user) return false
  return user.role === role
}
