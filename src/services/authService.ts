import api from "../api/axios"

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  data?: {
    user: {
      id: string
      email: string
      name?: string
    }
    access_token: string
    refresh_token: string
  }
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

export interface ResetPasswordData {
  email: string
  otp: string
  newPassword: string
}

class AuthService {
  /**
   * Đăng nhập người dùng
   */
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials)
    
    if (response.data.success && response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
      localStorage.setItem('access_token', response.data.data.access_token)
      localStorage.setItem('refresh_token', response.data.data.refresh_token)
    }
    
    return response.data
  }

  /**
   * Đăng ký tài khoản mới
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data)
    return response.data
  }

  /**
   * Gửi email quên mật khẩu
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>("/auth/forgot-password", {
      email
    })
    return response.data
  }

  /**
   * Đặt lại mật khẩu với OTP
   */
  async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/reset-password", data)
    return response.data
  }

  /**
   * Lấy thông tin profile người dùng
   */
  async getProfile(): Promise<{ 
    success: boolean;
    data: {
      id: string;
      email: string;
      username: string;
      avatar: string;
      enabled: boolean;
      authorities: string[];
      name?: string;
    }
  }> {
    const response = await api.get("/auth/profile")
    return response.data
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    const refresh_token = localStorage.getItem('refresh_token')
    if (!refresh_token) {
      throw new Error('No refresh token found')
    }

    const response = await api.post<AuthResponse>("/auth/refresh-token", { 
      refreshToken: refresh_token 
    })
    
    if (response.data.success && response.data.data) {
      localStorage.setItem('access_token', response.data.data.access_token)
      localStorage.setItem('refresh_token', response.data.data.refresh_token)
    }
    
    return response.data
  }

  /**
   * Đăng xuất
   */
  logout(): void {
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

export const authService = new AuthService()

// Legacy exports for backward compatibility
export const login = authService.login.bind(authService)
export const refreshToken = authService.refreshToken.bind(authService)
export const logout = authService.logout.bind(authService)

export default authService
