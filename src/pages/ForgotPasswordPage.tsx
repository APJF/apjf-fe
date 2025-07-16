import React from 'react';
import Layout from '../components/layout/Layout';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';

const ForgotPasswordPage: React.FC = () => {
  return (
    <Layout>
      <ForgotPasswordForm />
    </Layout>
  );
};

export default ForgotPasswordPage;
