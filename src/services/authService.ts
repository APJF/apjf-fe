import api from "../api/axios"
import type {
  UpdateProfileData,
  UpdateProfileResponse,
  UploadAvatarResponse,
  LoginCredentials as LoginData,
  RegisterData,
  UserInfo,
  AuthResponse,
  LoginResponse,
  UserAuthResponse,
  SendOtpData,
  ChangePasswordData,
  UserProfileResponse,
  ForgotPasswordResponse,
  ResetPasswordData,
  VerifyOtpData
} from "../types/auth"

class AuthService {
  /**
   * Đăng nhập người dùng
   */
  async login(credentials: LoginData): Promise<UserAuthResponse> {
    try {
      console.log('🔐 Starting login process');
      const response = await api.post<LoginResponse>("/auth/login", credentials)

      if (response.data.success && response.data.data) {
        const { access_token, refresh_token } = response.data.data;

        // Defensive check to ensure tokens are valid strings before saving
        if (typeof access_token !== 'string' || access_token.length === 0) {
          console.error('❌ Login Error: access_token is missing or invalid in the API response.');
          return { success: false, message: 'Lỗi đăng nhập: Phản hồi từ server không hợp lệ.', timestamp: Date.now() };
        }
        
        localStorage.setItem("access_token", access_token);

        if (typeof refresh_token === 'string' && refresh_token.length > 0) {
          localStorage.setItem("refresh_token", refresh_token);
        } else {
          // Log a warning but don't block login. Refresh will fail later.
          console.warn('⚠️ Login Warning: refresh_token is missing or invalid in the API response.');
          // You might want to clear any old refresh token
          localStorage.removeItem("refresh_token");
        }
        
        console.log('✅ Tokens saved successfully');
        
        // Gọi getProfile để lấy thông tin user sau khi có token
        try {
          console.log('📋 Fetching user profile...');
          const profileResponse = await this.getProfile();
          
          if (profileResponse.success && profileResponse.data) {
            // Lưu thông tin user từ profile API
            const profileData = profileResponse.data;
            
            // Map authorities to roles for backward compatibility
            const userInfo = {
              id: profileData.id,
              email: profileData.email,
              username: profileData.username,
              avatar: profileData.avatar || '',
              roles: profileData.authorities || [] // Map authorities to roles
            };
            
            localStorage.setItem("userInfo", JSON.stringify(userInfo))
            
            // Dispatch custom event với thông tin user
            window.dispatchEvent(new CustomEvent('authStateChanged', {
              detail: { user: userInfo, isAuthenticated: true }
            }));
            
            console.log('✅ Login successful with user profile:', userInfo.username);
            
            // Return success response với user data
            return {
              success: true,
              message: response.data.message || "Đăng nhập thành công",
              data: profileData, // Return original profile data
              timestamp: Date.now()
            };
          } else {
            console.error('❌ Profile fetch failed after login:', profileResponse.message);
            // Clear tokens nếu không lấy được profile
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            
            return {
              success: false,
              message: "Đăng nhập thành công nhưng không thể tải thông tin người dùng",
              timestamp: Date.now()
            };
          }
        } catch (profileError) {
          console.error('❌ Profile fetch error after login:', profileError);
          // Clear tokens nếu lỗi
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          
          return {
            success: false,
            message: "Đăng nhập thành công nhưng có lỗi khi tải thông tin người dùng",
            timestamp: Date.now()
          };
        }
      }

      console.log('❌ Login failed:', response.data.message);
      return {
        success: false,
        message: response.data.message || "Đăng nhập thất bại",
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data) {
          return {
            success: false,
            message: axiosError.response.data.message || "Đăng nhập thất bại",
            timestamp: Date.now()
          }
        }
      }
      return {
        success: false,
        message: "Có lỗi xảy ra khi đăng nhập",
        timestamp: Date.now()
      }
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
      const response = await api.post<ForgotPasswordResponse>("/auth/send-otp", null, {
        params: {
          email: email,
          type: 'reset_password'
        }
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
        params: {
          email: data.email,
          otp: data.otp
        }
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
   * Gửi OTP (cho đăng ký hoặc reset password)
   */
  async sendOtp(data: SendOtpData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/send-otp", null, {
        params: {
          email: data.email,
          type: data.type
        }
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
   * Gửi lại mã OTP xác thực tài khoản (legacy method for backward compatibility)
   */
  async sendVerificationOtp(email: string): Promise<AuthResponse> {
    return this.sendOtp({ email, type: 'registration' })
  }

  /**
   * Lấy thông tin profile người dùng
   */
  async getProfile(): Promise<UserProfileResponse> {
    try {
      const response = await api.get<UserProfileResponse>("/users/profile")
      return response.data
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: UserProfileResponse } }
        if (axiosError.response?.data) {
          return axiosError.response.data
        }
      }
      throw error
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    const refresh_token = localStorage.getItem("refresh_token")
    if (!refresh_token) {
      return {
        success: false,
        message: "No refresh token available",
        timestamp: Date.now()
      }
    }
    try {
      const response = await api.post('/auth/refresh-token', { 
        refresh_token: refresh_token
      })
      
      if (response.data.success && response.data.data) {
        const { access_token, refresh_token: newRefreshToken } = response.data.data
        
        // Update tokens
        localStorage.setItem("access_token", access_token)
        if (newRefreshToken) {
          localStorage.setItem("refresh_token", newRefreshToken)
        }
      }
      return response.data;
    } catch (error) {
      console.error('Error in refreshToken:', error);
      return {
        success: false,
        message: 'Failed to refresh token'
      };
    }
  }

  /**
   * Thay đổi mật khẩu (đã đăng nhập)
   */
  async changePassword(data: ChangePasswordData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>("/auth/change-password", data)
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
   * Cập nhật localStorage với user info mới và dispatch event
   */
  updateUserInLocalStorage(userInfo: UserInfo) {
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    
    // Dispatch event để notify các component khác
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { user: userInfo, isAuthenticated: true }
    }));
    
    console.log('✅ Updated localStorage and dispatched auth state change');
  }

  /**
   * Refresh user info từ backend và cập nhật localStorage
   */
  async refreshUserInfo(): Promise<boolean> {
    try {
      const profileResponse = await this.getProfile();
      if (profileResponse.success && profileResponse.data) {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            username: profileResponse.data.username,
            email: profileResponse.data.email,
            phone: profileResponse.data.phone || '',
            avatar: profileResponse.data.avatar || currentUser.avatar,
            roles: profileResponse.data.authorities || currentUser.roles // Map authorities to roles
          };
          
          this.updateUserInLocalStorage(updatedUser);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh user info:', error);
      return false;
    }
  }

  /**
   * Cập nhật thông tin profile
   */
  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    try {
      const response = await api.post<UpdateProfileResponse>("/users/profile", data)
      
      // Cập nhật user info trong localStorage nếu thành công
      if (response.data.success) {
        const currentUser = this.getCurrentUser()
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            email: data.email,
            username: data.username,
            phone: data.phone,
            // Chỉ update avatar nếu có avatar mới và là full URL, không thì giữ nguyên
            // Tránh việc cập nhật với object name thay vì full URL
            avatar: (data.avatar && (data.avatar.startsWith('http://') || data.avatar.startsWith('https://'))) 
              ? data.avatar 
              : currentUser.avatar
          }
          
          console.log('Updating localStorage with user:', updatedUser);
          localStorage.setItem("userInfo", JSON.stringify(updatedUser))
          
          // Dispatch event để notify các component khác
          window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { user: updatedUser, isAuthenticated: true }
          }))
        }
      }
      
      return response.data
    } catch (error) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: UpdateProfileResponse } }
        if (axiosError.response?.data) {
          return axiosError.response.data
        }
      }
      throw error
    }
  }

  /**
   * Cập nhật avatar trong profile sau khi upload
   */
  private async updateProfileWithAvatar(avatarObjectName: string): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) return false;
      
      const profileResponse = await this.getProfile();
      if (!profileResponse.success || !profileResponse.data) return false;
      
      const currentProfile = profileResponse.data;
      const updateData = {
        username: currentProfile.username,
        email: currentProfile.email,
        phone: currentProfile.phone || '', // Provide default empty string
        avatar: avatarObjectName
      };
      
      console.log('📤 Updating profile with new avatar:', updateData);
      const updateResponse = await this.updateProfile(updateData);
      
      if (updateResponse.success) {
        console.log('✅ Profile updated successfully with new avatar');
        return true;
      } else {
        console.error('❌ Failed to update profile with new avatar:', updateResponse.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating profile with avatar:', error);
      return false;
    }
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<UploadAvatarResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post<UploadAvatarResponse>("/users/avatar", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Nếu upload thành công, tự động cập nhật profile với avatar mới
      if (response.data.success && response.data.data) {
        const avatarObjectName = response.data.data;
        console.log('✅ Avatar uploaded, object name:', avatarObjectName);
        
        // Cập nhật profile với avatar mới
        await this.updateProfileWithAvatar(avatarObjectName);
        
        return response.data;
      }
      
      return response.data
    } catch (error) {
      console.error('=== UPLOAD AVATAR ERROR ===', error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: UploadAvatarResponse } }
        if (axiosError.response?.data) {
          return axiosError.response.data
        }
      }
      throw error
    }
  }

  /**
   * Google OAuth2 Login - redirect to Google OAuth
   */
  initiateGoogleLogin(): void {
    // Use a consistent approach for the API base URL
    const baseUrl = 'http://localhost:8080';
    
    // Remove /api suffix for OAuth endpoint if needed
    const oauthBaseUrl = baseUrl.replace('/api', '');
    window.location.href = `${oauthBaseUrl}/oauth2/authorization/google`;
  }

  /**
   * Xử lý callback từ Google OAuth2
   */
  handleGoogleCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search)
    const access_token = urlParams.get('token') || ''
    const refresh_token = urlParams.get('refreshToken') || ''
    const email = urlParams.get('email')
    const username = urlParams.get('username')

    if (access_token && refresh_token && email && username) {
      // Tạo userInfo object
      const userInfo: UserInfo = {
        id: 0, // Temporary ID, backend sẽ provide proper ID
        email,
        username,
        avatar: '',
        roles: ['ROLE_USER'] // Default role
      }

      // Lưu tokens và userInfo
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      // Dispatch auth state change event
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { user: userInfo, isAuthenticated: true }
      }))

      return true
    }

    // Xử lý error case
    const error = urlParams.get('error')
    const message = urlParams.get('message')
    if (error || message) {
      console.error('Google OAuth error:', { error, message })
    }

    return false
  }

  /**
   * Đăng xuất
   */
  logout(): void {
    localStorage.removeItem('userInfo')
    
    // Standard keys
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    
    // Remove legacy keys for cleanup
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    
    // Dispatch custom event để notify các component khác
    window.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: { user: null, isAuthenticated: false }
    }))
  }

  /**
   * Get auth header for manual requests
   */
  getAuthHeader(): string | null {
    const token = localStorage.getItem('access_token')
    if (token) {
      return `Bearer ${token}`
    }
    return null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  }

  /**
   * Get current user info
   */
  getCurrentUser(): UserInfo | null {
    try {
      const userInfo = localStorage.getItem('userInfo')
      return userInfo ? JSON.parse(userInfo) : null
    } catch (error) {
      console.error('Failed to parse user info:', error)
      return null
    }
  }
}

export const authService = new AuthService()

// Legacy exports for backward compatibility
export const login = authService.login.bind(authService)
export const getProfile = authService.getProfile.bind(authService)
export const refreshToken = authService.refreshToken.bind(authService)
export const logout = authService.logout.bind(authService)

export default authService
