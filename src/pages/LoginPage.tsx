import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';

/**
 * Login Page Component - Trang đăng nhập
 * Sử dụng LoginForm component với layout 2 cột đẹp
 * Có Header và Footer từ Layout wrapper
 */
const LoginPage: React.FC = () => {
  return (
    <div className="bg-gray-50">
      <LoginForm />
    </div>
  );
};

export default LoginPage;