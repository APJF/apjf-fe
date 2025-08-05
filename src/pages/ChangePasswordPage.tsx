import React from 'react';
import Layout from '../components/layout/Layout';
import { ChangePasswordForm } from '../components/auth/ChangePasswordForm';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

/**
 * Change Password Page Component - Trang đổi mật khẩu
 * Chỉ dành cho user đã đăng nhập
 */
const ChangePasswordPage: React.FC = () => {
  return (
    <ProtectedRoute requiredRoles={['USER']}>
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-0">
            <ChangePasswordForm />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ChangePasswordPage;
