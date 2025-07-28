import api from "../api/axios"

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
}

export interface UserInfo {
  id: number
  email: string
  username: string
  avatar: string
  roles: string[]
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    accessToken: string
    refreshToken: string
    tokenType: string
    userInfo: UserInfo
  }
  timestamp?: number
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

export interface VerifyOtpData {
  email: string
  otp: string
}

class AuthService {
  /**
   * Đăng nhập người dùng
   */
  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/login", credentials)

      if (response.data.success && response.data.data) {
        localStorage.setItem("user", JSON.stringify(response.data.data.userInfo))
        localStorage.setItem("access_token", response.data.data.accessToken)
        localStorage.setItem("refresh_token", response.data.data.refreshToken)
      }

      return response.data
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: AuthResponse } }
        if (axiosError.response?.data) {
          return axiosError.response.data
        }
      }
      throw error
    }
  }

  /**
   * Đăng ký tài khoản mới
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/register", data)
      return response.data
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: AuthResponse } }
        if (axiosError.response?.data) {
          // Trả về response data từ backend ngay cả khi có lỗi
          return axiosError.response.data
        }
      }
      // Nếu không bắt được error response từ backend, throw lỗi
      throw error
    }
  }

  /**
   * Gửi email quên mật khẩu
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      const response = await api.post<ForgotPasswordResponse>("/auth/forgot-password", {
        email
      })
      return response.data
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: ForgotPasswordResponse } }
        if (axiosError.response?.data) {
          return axiosError.response.data
        }
      }
      throw error
    }
  }

  /**
   * Đặt lại mật khẩu với OTP
   */
  async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/reset-password", data)
      return response.data
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: AuthResponse } }
        if (axiosError.response?.data) {
          return axiosError.response.data
        }
      }
      throw error
    }
  }

  /**
   * Xác thực OTP
   */
  async verifyOtp(data: VerifyOtpData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/verify", null, {
        params: data
      })
      return response.data
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: AuthResponse } }
        if (axiosError.response?.data) {
          return axiosError.response.data
        }
      }
      throw error
    }
  }

  /**
   * Gửi lại mã OTP xác thực tài khoản
   */
  async sendVerificationOtp(email: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        "/auth/send-verification-otp",
        null,
        {
          params: { email }
        }
      )
      return response.data
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: AuthResponse } }
        if (axiosError.response?.data) {
          return axiosError.response.data
        }
      }
      throw error
    }
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
    const refresh_token = localStorage.getItem("refresh_token")
    if (!refresh_token) {
      throw new Error("No refresh token found")
    }

    const response = await api.post<AuthResponse>("/auth/refresh-token", {
      refreshToken: refresh_token
    })

    if (response.data.success && response.data.data) {
      localStorage.setItem("access_token", response.data.data.accessToken)
      if (response.data.data.refreshToken) {
        localStorage.setItem("refresh_token", response.data.data.refreshToken)
      }
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
export const getProfile = authService.getProfile.bind(authService)
export const refreshToken = authService.refreshToken.bind(authService)
export const logout = authService.logout.bind(authService)

export default authService
