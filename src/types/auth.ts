export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  enabled?: boolean;
  authorities?: string[];
  roles?: string[];
}

export interface UserInfo {
  id: number;
  email: string;
  username: string;
  avatar: string;
  roles: string[];
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordData {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface SendOtpData {
  email: string;
  type: 'registration' | 'reset_password';
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  enabled?: boolean;
  authorities: string[];
  roles?: string[];
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
  timestamp: number;
}

export interface UpdateProfileData {
  email: string;
  username: string;
  phone?: string;
  avatar?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: string;
  timestamp: number;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: string;
  timestamp: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    tokenType: string;
    userInfo: UserInfo;
  };
  timestamp?: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    tokenType?: string;
  };
  timestamp?: number;
}

export interface UserAuthResponse {
  success: boolean;
  message: string;
  data?: UserProfile | null;
  timestamp?: number;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}
