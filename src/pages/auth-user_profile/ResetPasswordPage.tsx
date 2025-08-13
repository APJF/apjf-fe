import React from 'react';
import Layout from '../../components/layout/Layout';
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm';

const ResetPasswordPage: React.FC = () => {
  return (
    <Layout>
      <ResetPasswordForm />
    </Layout>
  );
};

export default ResetPasswordPage;
