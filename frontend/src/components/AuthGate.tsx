import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getStoredSession } from '../lib/auth'

type AuthGateProps = {
  children: ReactNode
  requiredRole?: string
  requiredPermission?: string
}

export function AuthGate({ children, requiredRole, requiredPermission }: AuthGateProps) {
  const session = getStoredSession()
  const location = useLocation()

  if (!session?.token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requiredRole && session.user.role !== requiredRole && session.user.role !== 'Administrator') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requiredPermission && session.user.permissions.includes(requiredPermission) === false && session.user.role !== 'Administrator') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
