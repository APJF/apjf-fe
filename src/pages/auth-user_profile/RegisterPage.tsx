import React from 'react';
import { RegisterForm } from '../../components/auth/RegisterForm';

/**
 * Register Page Component - Trang đăng ký
 * Sử dụng RegisterForm component với layout 2 cột đẹp
 * Có Header và Footer từ Layout wrapper
 */
const RegisterPage: React.FC = () => {
  return (
    <div className="bg-gray-50">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
