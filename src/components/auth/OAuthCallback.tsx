import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useToast } from '../../hooks/useToast';

/**
 * OAuth Callback Component
 * Xử lý callback từ Google OAuth2 và redirect user
 */
const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    // Đảm bảo chỉ xử lý một lần
    if (processedRef.current) return;
    processedRef.current = true;

    let redirectTimer: NodeJS.Timeout;

    // Kiểm tra URL có chứa parameters cần thiết không
    const urlParams = new URLSearchParams(window.location.search);
    const hasRequiredParams = urlParams.get('token') && urlParams.get('refreshToken');
    
    if (!hasRequiredParams) {
      // Không có parameters cần thiết, redirect về login
      const error = urlParams.get('error');
      const message = urlParams.get('message');
      
      if (error || message) {
        const errorMessage = message || error || "Đăng nhập Google thất bại";
        showToast("error", errorMessage);
        redirectTimer = setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        // Không có error params, redirect về login ngay
        navigate('/login', { replace: true });
      }
      return () => {
        if (redirectTimer) clearTimeout(redirectTimer);
      };
    }

    // Xử lý callback thành công
    const success = authService.handleGoogleCallback();
    
    if (success) {
      showToast("success", "Đăng nhập Google thành công!");
      redirectTimer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } else {
      showToast("error", "Đăng nhập Google thất bại");
      redirectTimer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [navigate, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
