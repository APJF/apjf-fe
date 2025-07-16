import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import HomePage from '../pages/HomePage';
import CoursesPage from '../pages/CoursesPage';
import CourseDetailPage from '../pages/CourseDetailPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

/**
 * Router Configuration - Cấu hình routing cho ứng dụng
 * Sử dụng React Router v6 với createBrowserRouter
 * Layout wrapper cho các trang có header/footer
 * Auth pages không có layout wrapper
 */

// Main router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><HomePage /></Layout>,
    errorElement: <div>404 - Trang không tồn tại</div>, // Error boundary
  },
  {
    path: '/courses',
    element: <Layout><CoursesPage /></Layout>,
  },
  {
    path: '/courses/:courseId',
    element: <Layout><CourseDetailPage /></Layout>,
  },
  {
    path: '/login',
    element: <Layout><LoginPage /></Layout>, // Có layout với header/footer
  },
  {
    path: '/register',
    element: <Layout><RegisterPage /></Layout>, // Có layout với header/footer
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />, // Không có layout để giống như login/register hiện tại
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />, // Không có layout để giống như login/register hiện tại
  },
  // Catch all route for 404
  {
    path: '*',
    element: <Layout><div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1><p className="text-gray-600 mb-4">Trang bạn tìm kiếm không tồn tại</p><a href="/" className="text-red-600 hover:text-red-700">Về trang chủ</a></div></div></Layout>,
  },
  // Insert additional routes here
  /*
  {
    path: '/course/:id',
    element: <Layout><CourseDetailPage /></Layout>,
  },
  {
    path: '/profile',
    element: <Layout><ProfilePage /></Layout>,
    loader: requireAuth, // Route protection
  },
  {
    path: '/dashboard',
    element: <Layout><DashboardPage /></Layout>,
    loader: requireAuth,
  },
  */
]);

/**
 * AppRouter Component - Router wrapper component
 * Sử dụng RouterProvider để cung cấp router cho toàn bộ app
 */
const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
