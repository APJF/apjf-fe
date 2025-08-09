"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  User, 
  Lock,
  Info,
  Link,
  Wifi,
  Bell
} from "lucide-react"
import authService from "../services/authService"
import { useToast } from "../hooks/useToast"
import { ChangePasswordForm } from "../components/auth/ChangePasswordForm"
import type { UserProfile } from "../types/auth"

const AccountSettingItem = ({ icon, text, active, onClick }: { icon: React.ReactNode, text: string, active: boolean, onClick: () => void }) => (
    <button
        className={`flex items-center px-4 py-3 text-base font-medium cursor-pointer w-full ${
            active ? "text-red-600 border-l-4 border-red-600 bg-red-50" : "text-gray-700 hover:bg-gray-100"
        }`}
        onClick={onClick}
    >
        {icon}
        <span className="ml-4">{text}</span>
    </button>
);

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleProfileUpdate = useCallback((updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  }, []);

  const handleConnectionError = useCallback((error: unknown) => {
    console.error("Error fetching profile:", error);
    
    // Check for connection errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
      setError("Mất kết nối với server");
      showToast("error", "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.");
    } else if (error && typeof error === 'object' && 'message' in error && 
               typeof error.message === 'string' && error.message.includes('ERR_CONNECTION_REFUSED')) {
      setError("Server không phản hồi");
      showToast("error", "Không thể kết nối đến server. Vui lòng thử lại sau.");
    } else if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number, data?: unknown } };
      if (axiosError.response?.status === 403) {
        setError("Không có quyền truy cập");
        showToast("error", "Bạn không có quyền truy cập thông tin này.");
      } else {
        setError("Có lỗi xảy ra khi tải dữ liệu");
        showToast("error", "Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.");
      }
    } else {
      setError("Có lỗi không xác định");
      showToast("error", "Có lỗi không xác định xảy ra. Vui lòng thử lại.");
    }
  }, [showToast]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Check if user is authenticated first
        const isAuth = authService.isAuthenticated();
        
        if (!isAuth) {
          console.error("User not authenticated");
          setError("Bạn chưa đăng nhập");
          showToast("error", "Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
          return;
        }

        const response = await authService.getProfile();
        
        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          setError("Không thể tải thông tin profile");
          showToast("error", response.message || "Không thể tải thông tin profile");
        }
      } catch (error) {
        handleConnectionError(error);
      } finally {
        setIsLoading(false)
      }
    };

    fetchProfile();
  }, [showToast, handleConnectionError]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No profile data
  if (!profile) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600">Không có dữ liệu profile</p>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralTab profile={profile} onProfileUpdate={handleProfileUpdate} />;
      case "password":
        return <PasswordTab />;
      case "info":
        return <InfoTab />;
      case "social":
        return <SocialLinksTab />;
      case "connections":
        return <ConnectionsTab />;
      case "notifications":
        return <NotificationsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h4 className="text-2xl font-bold py-3 mb-4">Account settings</h4>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="flex">
          <div className="w-1/4 border-r">
            <div className="py-4">
              <AccountSettingItem icon={<User size={20} />} text="General" active={activeTab === "general"} onClick={() => setActiveTab("general")} />
              <AccountSettingItem icon={<Lock size={20} />} text="Change password" active={activeTab === "password"} onClick={() => setActiveTab("password")} />
              <AccountSettingItem icon={<Info size={20} />} text="Info" active={activeTab === "info"} onClick={() => setActiveTab("info")} />
              <AccountSettingItem icon={<Link size={20} />} text="Social links" active={activeTab === "social"} onClick={() => setActiveTab("social")} />
              <AccountSettingItem icon={<Wifi size={20} />} text="Connections" active={activeTab === "connections"} onClick={() => setActiveTab("connections")} />
              <AccountSettingItem icon={<Bell size={20} />} text="Notifications" active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} />
            </div>
          </div>
          <div className="w-3/4">
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const GeneralTab = ({ profile, onProfileUpdate }: { profile: UserProfile, onProfileUpdate: (updatedProfile: UserProfile) => void }) => {
  const [formData, setFormData] = useState({
    username: profile.username,
    email: profile.email,
    phone: profile.phone,
    avatar: profile.avatar
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Update form when profile prop changes
  useEffect(() => {
    const newFormData = {
      username: profile.username,
      email: profile.email,
      phone: profile.phone,
      avatar: profile.avatar
    };
    setFormData(newFormData);
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast("error", "Vui lòng chọn file hình ảnh");
      return;
    }

    // Validate file size (800KB)
    if (file.size > 800 * 1024) {
      showToast("error", "Kích thước file không được vượt quá 800KB");
      return;
    }

    try {
      setIsLoading(true);
      
      // Upload avatar and update profile (now handles everything internally)
      const uploadResponse = await authService.uploadAvatar(file);
      
      if (uploadResponse.success) {
        // Use the new helper method to refresh all user data
        const refreshSuccess = await authService.refreshUserInfo();
        
        if (refreshSuccess) {
          // Get fresh profile data for local state
          const freshProfileResponse = await authService.getProfile();
          if (freshProfileResponse.success && freshProfileResponse.data) {
            const freshProfile = freshProfileResponse.data;
            
            setFormData({
              username: freshProfile.username,
              email: freshProfile.email,
              phone: freshProfile.phone,
              avatar: freshProfile.avatar
            });
            
            onProfileUpdate(freshProfile);
            showToast("success", "Upload và cập nhật avatar thành công");
          }
        } else {
          showToast("error", "Avatar đã upload nhưng không thể refresh dữ liệu");
        }
      } else {
        showToast("error", uploadResponse.message || "Upload avatar thất bại");
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      showToast("error", "Không thể upload avatar. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // Chỉ cập nhật email, username, phone - không cập nhật avatar
      const basicProfileData = {
        email: formData.email,
        username: formData.username,
        phone: formData.phone
      };
      
      const response = await authService.updateBasicProfile(basicProfileData);
      
      if (response.success) {
        // Update parent component's profile state (giữ nguyên avatar hiện tại)
        const updatedProfile = {
          ...profile,
          username: formData.username,
          email: formData.email,
          phone: formData.phone
          // Không cập nhật avatar từ formData
        };
        onProfileUpdate(updatedProfile);
        
        showToast("success", response.message || "Cập nhật profile thành công");
      } else {
        showToast("error", response.message || "Cập nhật profile thất bại");
      }
    } catch (error) {
      console.error('Update profile error:', error);
      showToast("error", "Không thể cập nhật profile. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center">
        <img 
          src={formData.avatar || '/img/default-avatar.svg'} 
          alt="avatar" 
          className="w-24 h-24 rounded-full object-cover border border-gray-300"
          onError={(e) => {
            console.error('❌ Avatar failed to load:', formData.avatar);
            e.currentTarget.src = '/img/default-avatar.svg';
          }}
          onLoad={() => {
            console.log('✅ Avatar loaded successfully');
          }}
        />
        <div className="ml-6">
          <label htmlFor="avatar-upload" className={`px-4 py-2 border border-red-600 text-red-600 rounded-lg cursor-pointer hover:bg-red-50 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isLoading ? 'Đang upload...' : 'Upload new photo'}
            <input 
              id="avatar-upload" 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isLoading}
            />
          </label>
          <button 
            type="button" 
            className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
            disabled={isLoading}
          >
            Reset
          </button>
          <div className="text-sm text-gray-500 mt-2">Allowed JPG, GIF or PNG. Max size of 800K</div>
        </div>
      </div>
      <hr className="my-6" />
      <div>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input 
            id="username" 
            name="username"
            type="text" 
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" 
            value={formData.username}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input 
            id="email" 
            name="email"
            type="email" 
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" 
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input 
            id="phone" 
            name="phone"
            type="tel" 
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" 
            value={formData.phone}
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang lưu...' : 'Save Changes'}
          </button>
          <button 
            onClick={() => setFormData({
              username: profile.username,
              email: profile.email,
              phone: profile.phone,
              avatar: profile.avatar
            })}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordTab = () => (
  <div>
    <ChangePasswordForm />
  </div>
);

const InfoTab = () => (
    <div>
        <div className="mb-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea id="bio" rows={5} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris nunc arcu, dignissim sit amet sollicitudin iaculis, vehicula id urna. Sed luctus urna nunc. Donec fermentum, magna sit amet rutrum pretium, turpis dolor molestie diam, ut lacinia diam risus eleifend sapien. Curabitur ac nibh nulla. Maecenas nec augue placerat, viverra tellus non, pulvinar risus.
            </textarea>
        </div>
        <div className="mb-4">
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-2">Birthday</label>
            <input id="birthday" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="May 3, 1995" />
        </div>
        <div className="mb-4">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <select id="country" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                <option>USA</option>
                <option>Canada</option>
                <option>UK</option>
                <option>Germany</option>
                <option>France</option>
            </select>
        </div>
        <hr className="my-6" />
        <h6 className="text-lg font-medium mb-4">Contacts</h6>
        <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input id="phone" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="+0 (123) 456 7891" />
        </div>
        <div className="mb-4">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input id="website" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
        </div>
    </div>
);

const SocialLinksTab = () => (
    <div>
        <div className="mb-4">
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
            <input id="twitter" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="https://twitter.com/user" />
        </div>
        <div className="mb-4">
            <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
            <input id="facebook" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="https://www.facebook.com/user" />
        </div>
        <div className="mb-4">
            <label htmlFor="google-plus" className="block text-sm font-medium text-gray-700 mb-2">Google+</label>
            <input id="google-plus" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
        </div>
        <div className="mb-4">
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
            <input id="linkedin" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
        </div>
        <div className="mb-4">
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
            <input id="instagram" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="https://www.instagram.com/user" />
        </div>
    </div>
);

const ConnectionsTab = () => (
    <div>
        <button type="button" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Connect to Twitter</button>
        <hr className="my-6" />
        <div>
            <h5 className="text-lg font-medium mb-2 flex items-center justify-between">
                <span>You are connected to Google:</span>
                <button type="button" className="text-gray-500 text-xs ml-2">Remove</button>
            </h5>
            <a href="#!">[email protected]</a>
        </div>
        <hr className="my-6" />
        <button type="button" className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800">Connect to Facebook</button>
        <hr className="my-6" />
        <button type="button" className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">Connect to Instagram</button>
    </div>
);

const NotificationsTab = () => (
    <div>
        <h6 className="text-lg font-medium mb-4">Activity</h6>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="ml-2">Email me when someone comments on my article</span>
            </label>
        </div>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="ml-2">Email me when someone answers on my forum thread</span>
            </label>
        </div>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" />
                <span className="ml-2">Email me when someone follows me</span>
            </label>
        </div>
        <hr className="my-6" />
        <h6 className="text-lg font-medium mb-4">Application</h6>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="ml-2">News and announcements</span>
            </label>
        </div>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" />
                <span className="ml-2">Weekly product updates</span>
            </label>
        </div>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="ml-2">Weekly blog digest</span>
            </label>
        </div>
    </div>
);
