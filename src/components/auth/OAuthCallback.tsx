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
    console.log('🚀 [OAuthCallback] Component mounted');
    console.log('🌐 [OAuthCallback] Current URL:', window.location.href);
    
    // Đảm bảo chỉ xử lý một lần
    if (processedRef.current) {
      console.log('⚠️  [OAuthCallback] Already processed, skipping...');
      return;
    }
    processedRef.current = true;

    let redirectTimer: NodeJS.Timeout;

    // Kiểm tra tất cả URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('📋 [OAuthCallback] All URL parameters:');
    for (const [key, value] of urlParams.entries()) {
      console.log(`  - ${key}:`, key === 'code' || key === 'token' ? `${value.substring(0, 20)}...` : value);
    }
    
    // Check for OAuth 2.0 parameters (NEW)
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    // Check for legacy parameters (OLD)
    const hasRequiredParams = urlParams.get('token') && urlParams.get('refreshToken');
    
    console.log('🔍 [OAuthCallback] Parameter analysis:');
    console.log('  - OAuth 2.0 code:', code ? 'present' : 'missing');
    console.log('  - OAuth 2.0 state:', state ? 'present' : 'missing');
    console.log('  - OAuth 2.0 error:', error || 'none');
    console.log('  - Legacy params:', hasRequiredParams ? 'present' : 'missing');
    
    // Check if we have either OAuth 2.0 or legacy parameters
    const hasValidParams = code || hasRequiredParams;
    
    if (!hasValidParams) {
      console.log('❌ [OAuthCallback] No valid OAuth parameters found');
      
      // Không có parameters cần thiết, redirect về login
      const message = urlParams.get('message');
      
      if (error || message) {
        const errorMessage = message || error || "Đăng nhập Google thất bại";
        console.error('❌ [OAuthCallback] OAuth error:', errorMessage);
        showToast("error", errorMessage);
        redirectTimer = setTimeout(() => {
          console.log('🔙 [OAuthCallback] Redirecting to login with error...');
          navigate('/auth/login', { replace: true });
        }, 2000);
      } else {
        // Không có error params, redirect về login ngay
        console.log('🔙 [OAuthCallback] No params, redirecting to login...');
        navigate('/auth/login', { replace: true });
      }
      return () => {
        if (redirectTimer) clearTimeout(redirectTimer);
      };
    }

    console.log('✅ [OAuthCallback] Valid OAuth parameters found, processing callback...');

    // Xử lý callback thành công với async/await
    const handleCallback = async () => {
      try {
        console.log('⏳ [OAuthCallback] Calling authService.handleGoogleCallback()...');
        const success = await authService.handleGoogleCallback();
        
        console.log('🔍 [OAuthCallback] Callback result:', success);
        
        if (success) {
          console.log('🎉 [OAuthCallback] OAuth callback successful!');
          showToast("success", "Đăng nhập Google thành công!");
          redirectTimer = setTimeout(() => {
            console.log('🏠 [OAuthCallback] Redirecting to home...');
            navigate('/', { replace: true });
          }, 1000);
        } else {
          console.log('❌ [OAuthCallback] OAuth callback failed');
          showToast("error", "Đăng nhập Google thất bại");
          redirectTimer = setTimeout(() => {
            console.log('🔙 [OAuthCallback] Redirecting to login after failure...');
            navigate('/auth/login', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('❌ [OAuthCallback] Google OAuth callback error:', error);
        showToast("error", "Có lỗi xảy ra trong quá trình đăng nhập");
        redirectTimer = setTimeout(() => {
          console.log('🔙 [OAuthCallback] Redirecting to login after error...');
          navigate('/auth/login', { replace: true });
        }, 2000);
      }
    };

    handleCallback();

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
