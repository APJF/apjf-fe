export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number; // Changed from string to number to match API
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  enabled?: boolean;
  authorities?: string[];
  roles?: string[]; // Roles từ API có format: ["ROLE_USER", "ROLE_STAFF", "ROLE_MANAGER"]
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
  id: number; // Changed from string to number to match API
  username: string;
  email: string;
  phone: string;
  avatar: string;
  enabled: boolean;
  authorities: string[];
  roles?: string[]; // Add roles field for consistency
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
  phone: string;
  avatar: string;
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
