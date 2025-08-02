import { useAuth } from "../../hooks/useAuth"
import { Navigate } from "react-router-dom"
import authService from "../../services/authService"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallbackPath?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = "/login"
}) => {
  const { user } = useAuth()

  // Nếu chưa đăng nhập
  if (!user || !authService.isAuthenticated()) {
    return <Navigate to={fallbackPath} replace />
  }

  // Nếu cần kiểm tra role
  if (requiredRoles.length > 0) {
    // Convert requiredRoles to ROLE_ format if needed
    const normalizedRequiredRoles = requiredRoles.map(role => 
      role.startsWith('ROLE_') ? role : `ROLE_${role}`
    )
    
    const hasRequiredRole = normalizedRequiredRoles.some(role => 
      user.roles?.includes(role) || 
      user.authorities?.includes(role) // Support both roles and authorities
    )

    if (!hasRequiredRole) {
      // Redirect về trang chủ nếu không đủ quyền với message
      console.warn('User does not have required roles:', {
        userRoles: user.roles || user.authorities,
        requiredRoles: normalizedRequiredRoles
      })
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
