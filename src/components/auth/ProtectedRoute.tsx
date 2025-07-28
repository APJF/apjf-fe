import { useAuth } from "../../hooks/useAuth"
import { Navigate } from "react-router-dom"

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
  if (!user) {
    return <Navigate to={fallbackPath} replace />
  }

  // Nếu cần kiểm tra role
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.roles?.includes(role) || user.roles?.includes(role.toUpperCase())
    )

    if (!hasRequiredRole) {
      // Redirect về trang chủ nếu không đủ quyền
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
