import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import HomePage from "../pages/HomePage";
import CoursesPage from "../pages/CoursesPage";
import CourseDetailPage from "../pages/CourseDetailPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ChatbotPage from "../pages/ChatbotPage";
import UserProfilePage from "../pages/UserProfilePage";
import StaffDashboardPage from "../pages/StaffDashboardPage";
import StaffCoursesPage from "../pages/StaffCoursesPage";
import StaffCourseDetailPage from "../pages/StaffCourseDetailPage";
import StaffChapterDetailPage from "../pages/StaffChapterDetailPage";
import StaffUnitDetailPage from "../pages/StaffUnitDetailPage";
import StaffCreateCoursePage from "../pages/StaffCreateCoursePage";
import StaffUpdateCoursePage from "../pages/StaffUpdateCoursePage";
import StaffUpdateChapterPage from "../pages/StaffUpdateChapterPage";
import StaffCreateChapterPage from "../pages/StaffCreateChapterPage";
import StaffCreateUnitPage from "../pages/StaffCreateUnitPage";
import StaffUpdateUnitPage from "../pages/StaffUpdateUnitPage";
import StaffManagerFeedbackPage from "../pages/StaffManagerFeedbackPage";
import StaffStudentFeedbackPage from "../pages/StaffStudentFeedbackPage";
import { ExamPreparationPage } from '../pages/ExamPreparationPage';
import { ExamDoingPage } from '../pages/ExamDoingPage';
import { ExamResultPage } from '../pages/ExamResultPage';
import { ExamAnswerReviewPage } from '../pages/ExamAnswerReviewPage';
/**
 * Router Configuration - Cấu hình routing cho ứng dụng
 * Sử dụng React Router v6 với createBrowserRouter
 * Layout wrapper cho các trang có header/footer
 * Auth pages không có layout wrapper
 */

// Main router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <HomePage />
      </Layout>
    ),
    errorElement: <div>404 - Trang không tồn tại</div>, // Error boundary
  },
  {
    path: "/courses",
    element: (
      <Layout>
        <CoursesPage />
      </Layout>
    ),
  },
  {
    path: "/courses/:courseId",
    element: (
      <Layout>
        <CourseDetailPage />
      </Layout>
    ),
  },
  {
    path: "/login",
    element: (
      <Layout>
        <LoginPage />
      </Layout>
    ), // Có layout với header/footer
  },
  {
    path: "/register",
    element: (
      <Layout>
        <RegisterPage />
      </Layout>
    ), // Có layout với header/footer
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />, // Không có layout để giống như login/register hiện tại
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />, // Không có layout để giống như login/register hiện tại
  },
  {
    path: "/chatbot",
    element: (
      <Layout>
        <ChatbotPage />
      </Layout>
    ),
  },
  {
    path: "/profile",
    element: (
      <Layout>
        <UserProfilePage />
      </Layout>
    ),
  },
  {
    path: "/staff/dashboard",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/courses",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffCoursesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/courses/:courseId",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffCourseDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/courses/:courseId/chapters/:chapterId",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffChapterDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/courses/:courseId/chapters/new",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffCreateChapterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/courses/:courseId/chapters/:chapterId/units/new",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffCreateUnitPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/courses/:courseId/chapters/:chapterId/units/:unitId",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffUnitDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/create-course",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffCreateCoursePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/courses/:courseId/edit",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffUpdateCoursePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/chapters/:chapterId/edit",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffUpdateChapterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/courses/:courseId/chapters/:chapterId/units/:unitId/edit",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffUpdateUnitPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/manager-feedback",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffManagerFeedbackPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/student-feedback",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffStudentFeedbackPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exam/:examId/preparation',
    element: <Layout><ExamPreparationPage /></Layout>,
  },
  {
    path: '/exam/:examId/take',
    element: <ExamDoingPage />, // No layout for exam taking page to avoid distractions
  },
  {
    path: '/exam/:examId/result',
    element: <Layout><ExamResultPage /></Layout>,
  },
  {
    path: '/exam-result/:resultId/review',
    element: <Layout><ExamAnswerReviewPage /></Layout>,
  },
  // Catch all route for 404
  {
    path: "*",
    element: (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-600 mb-4">
              Trang bạn tìm kiếm không tồn tại
            </p>
            <a href="/" className="text-red-600 hover:text-red-700">
              Về trang chủ
            </a>
          </div>
        </div>
      </Layout>
    ),
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
