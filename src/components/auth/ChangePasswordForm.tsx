import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import authService from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import type { ChangePasswordData } from '../../types/auth';

export function ChangePasswordForm() {
  const [formData, setFormData] = useState<ChangePasswordData>({
    email: '',
    oldPassword: '',
    newPassword: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Set email from user info
  React.useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear message when user starts typing
    if (message) {
      setMessage('');
      setIsSuccess(false);
    }
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = (): boolean => {
    if (!formData.oldPassword || !formData.newPassword || !confirmPassword) {
      setMessage('Vui lòng điền đầy đủ thông tin');
      return false;
    }

    if (formData.newPassword.length < 6) {
      setMessage('Mật khẩu mới phải có ít nhất 6 ký tự');
      return false;
    }

    if (formData.newPassword !== confirmPassword) {
      setMessage('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return false;
    }

    if (formData.oldPassword === formData.newPassword) {
      setMessage('Mật khẩu mới phải khác mật khẩu cũ');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await authService.changePassword(formData);

      if (response.success) {
        setIsSuccess(true);
        setMessage(response.message || 'Đổi mật khẩu thành công');
        showToast('success', 'Đổi mật khẩu thành công');
        
        // Reset form
        setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '' }));
        setConfirmPassword('');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setMessage(response.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Đổi Mật Khẩu</h2>
          <p className="text-gray-600">Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`border rounded-lg p-3 flex items-center gap-2 mb-6 ${
            isSuccess 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            {isSuccess ? (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <span className={`text-sm ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-2">
            <label htmlFor="oldPassword" className="text-sm font-medium text-gray-700">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="oldPassword"
                name="oldPassword"
                type={showPasswords.old ? 'text' : 'password'}
                required
                placeholder="Nhập mật khẩu hiện tại"
                value={formData.oldPassword}
                onChange={handleInputChange}
                maxLength={255}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('old')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.old ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="newPassword"
                name="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                required
                placeholder="Nhập mật khẩu mới"
                value={formData.newPassword}
                onChange={handleInputChange}
                maxLength={255}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                required
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={handleInputChange}
                maxLength={255}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(() => {
              if (isLoading) {
                return (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang xử lý...
                  </div>
                );
              }
              if (isSuccess) {
                return 'Đổi mật khẩu thành công';
              }
              return 'Đổi mật khẩu';
            })()}
          </button>
        </form>

        {/* Security Tips */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Lưu ý bảo mật:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Sử dụng mật khẩu dài ít nhất 6 ký tự</li>
            <li>• Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
            <li>• Không chia sẻ mật khẩu với ai khác</li>
            <li>• Thay đổi mật khẩu định kỳ để đảm bảo an toàn</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
