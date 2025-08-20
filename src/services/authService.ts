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
  private refreshTimer: NodeJS.Timeout | null = null;
  private tokenExpirationTime: number | null = null;

  /**
   * Schedule proactive token refresh before expiration
   */
  private scheduleTokenRefresh(expiresInSeconds?: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Default to 15 minutes if not provided, refresh 3 minutes before expiration
    const expireTime = expiresInSeconds || 15 * 60; // 15 minutes default
    const refreshTime = Math.max(expireTime - 3 * 60, 60); // Refresh 3 min early, but at least 1 min
    
    this.tokenExpirationTime = Date.now() + (expireTime * 1000);
    
    console.log(`🔄 Token refresh scheduled in ${refreshTime} seconds`);
    
    this.refreshTimer = setTimeout(async () => {
      try {
        console.log('🔄 Proactive token refresh triggered');
        const result = await this.refreshToken();
        
        if (result.success) {
          console.log('✅ Proactive token refresh successful');
          // Schedule next refresh
          this.scheduleTokenRefresh();
        } else {
          console.error('❌ Proactive token refresh failed, will fallback to 401 handling');
        }
      } catch (error) {
        console.error('❌ Proactive token refresh error:', error);
        // Don't logout here, let 401 interceptor handle it
      }
    }, refreshTime * 1000);
  }

  /**
   * Check if token expires in the next N minutes
   */
  private tokenExpiresInMinutes(minutes: number): boolean {
    if (!this.tokenExpirationTime) return false;
    const now = Date.now();
    const timeUntilExpiry = this.tokenExpirationTime - now;
    return timeUntilExpiry < (minutes * 60 * 1000);
  }

  /**
   * Proactively refresh token if needed (for critical operations)
   */
  async ensureValidTokenForCriticalOperation(): Promise<boolean> {
    try {
      // If token expires in next 5 minutes, refresh it now
      if (this.tokenExpiresInMinutes(5)) {
        console.log('🔄 Refreshing token for critical operation');
        const result = await this.refreshToken();
        return result.success;
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to ensure valid token:', error);
      return false;
    }
  }

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
            
            // Schedule proactive token refresh
            this.scheduleTokenRefresh();
            
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
        
        // Reschedule next proactive refresh
        this.scheduleTokenRefresh();
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
   * Cập nhật thông tin profile (không bao gồm avatar)
   */
  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    try {
      // Loại bỏ avatar khỏi data để không cập nhật avatar
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { avatar, ...profileDataWithoutAvatar } = data;
      
      const response = await api.put<UpdateProfileResponse>("/users/profile", profileDataWithoutAvatar)
      
      // Sau khi update thành công, gọi GET để refresh thông tin user
      if (response.data.success) {
        console.log('✅ Profile updated successfully, refreshing user info...');
        await this.refreshUserInfo();
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
   * Cập nhật profile chỉ với các field cơ bản (email, username, phone) - không bao gồm avatar
   */
  async updateBasicProfile(data: { email: string; username: string; phone?: string }): Promise<UpdateProfileResponse> {
    try {
      const response = await api.put<UpdateProfileResponse>("/users/profile", data)
      
      // Sau khi update thành công, gọi GET để refresh thông tin user
      if (response.data.success) {
        console.log('✅ Basic profile updated successfully, refreshing user info...');
        await this.refreshUserInfo();
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
        avatar: avatarObjectName // Lưu object name trực tiếp, không phải URL
      };
      
      console.log('📤 Updating profile with new avatar object name:', updateData);
      const response = await api.put<UpdateProfileResponse>("/users/profile", updateData);
      
      if (response.data.success) {
        console.log('✅ Profile updated successfully with new avatar');
        // Gọi GET để refresh thông tin user sau khi update
        await this.refreshUserInfo();
        return true;
      } else {
        console.error('❌ Failed to update profile with new avatar:', response.data.message);
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
    // Use environment variable for API base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    window.location.href = `${baseUrl}/oauth2/authorization/google`;
  }

  /**
   * Xử lý callback từ Google OAuth2
   */
  async handleGoogleCallback(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search)
    const access_token = urlParams.get('token') || ''
    const refresh_token = urlParams.get('refreshToken') || ''
    const email = urlParams.get('email')
    const username = urlParams.get('username')

    if (access_token && refresh_token && email && username) {
      try {
        // Lưu tokens trước
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        
        console.log('✅ Google OAuth tokens saved, fetching user profile...');
        
        // Gọi getProfile để lấy thông tin đầy đủ từ backend, bao gồm avatar
        const profileResponse = await this.getProfile();
        
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data;
          
          // Tạo userInfo object với thông tin đầy đủ từ backend
          const userInfo: UserInfo = {
            id: profileData.id,
            email: profileData.email,
            username: profileData.username,
            avatar: profileData.avatar || '', // Lấy avatar từ backend
            roles: profileData.authorities || ['ROLE_USER'] // Map authorities to roles
          }

          // Lưu userInfo đầy đủ
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
          
          // Dispatch auth state change event
          window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { user: userInfo, isAuthenticated: true }
          }))

          console.log('✅ Google OAuth login successful with full profile:', userInfo.username);
          return true;
        } else {
          console.error('❌ Failed to fetch profile after Google OAuth:', profileResponse.message);
          // Clear tokens nếu không lấy được profile
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          return false;
        }
      } catch (profileError) {
        console.error('❌ Profile fetch error after Google OAuth:', profileError);
        // Clear tokens nếu lỗi
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return false;
      }
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
    // Cancel any scheduled token refresh
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.tokenExpirationTime = null;
    
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
