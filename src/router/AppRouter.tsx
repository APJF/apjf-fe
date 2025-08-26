import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../components/layout/Layout";
import LayoutNoFooter from "../components/layout/LayoutNoFooter";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import OAuthCallback from "../components/auth/OAuthCallback";
import HomePage from "../pages/HomePage";
import CoursesPage from "../pages/CoursesPage";
import CourseDetailPage from "../pages/study/CourseDetailPage";
import ChapterDetailPage from "../pages/study/ChapterDetailPage";
import LearningPathPage from "../pages/learning-path/LearningPathPage";
import LearningPathDetailPage from "../pages/learning-path/LearningPathDetailPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import { VerifyOtpPage } from "../pages/auth/VerifyOtpPage";
import UserProfilePage from "../pages/auth/UserProfilePage";
import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage";
import StaffDashboardPage from "../pages/staff/StaffDashboardPage";
import StaffCoursesPage from "../pages/staff/StaffCoursesPage";
import StaffCourseDetailPage from "../pages/staff/StaffCourseDetailPage";
import StaffChapterDetailPage from "../pages/staff/StaffChapterDetailPage";
import StaffUnitDetailPage from "../pages/staff/StaffUnitDetailPage";
import StaffCreateCoursePage from "../pages/staff/StaffCreateCoursePage";
import StaffUpdateCoursePage from "../pages/staff/StaffUpdateCoursePage";
import StaffUpdateChapterPage from "../pages/staff/StaffUpdateChapterPage";
import StaffCreateChapterPage from "../pages/staff/StaffCreateChapterPage";
import StaffCreateUnitPage from "../pages/staff/StaffCreateUnitPage";
import StaffUpdateUnitPage from "../pages/staff/StaffUpdateUnitPage";
import StaffCreateExamPage from "../pages/staff/StaffCreateExamPage";
import StaffUpdateExamPage from "../pages/staff/StaffUpdateExamPage";
import StaffStudentFeedbackPage from "../pages/staff/StaffStudentFeedbackPage";
import { StaffManagerFeedbackPage } from "../pages/staff/StaffManagerFeedbackPage";
import { StaffCreateQuestion } from "../pages/staff/StaffCreateQuestion";
import ManagerApprovalRequestsPage from "../pages/manager/ManagerApprovalRequestsPage";
import ExamDetailPage from '../pages/exam/ExamDetailPage';
import { ExamTakingPage } from '../pages/exam/ExamTakingPage';
import ExamOverviewPage from '../pages/exam/ExamOverviewPage';
import { ExamReviewPage } from '../pages/exam/ExamReviewPage';
import ForumPage from "../pages/ForumPage";
import { ExamHistoryPage } from '../pages/exam/ExamHistoryPage';
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminManageAccountPage from "../pages/admin/AdminManageAccountPage";
import ChatbotPage from "../pages/ChatbotPage";
/**
 * Router Configuration - Cấu hình routing cho ứng dụng
 * Sử dụng React Router v6 với createBrowserRouter
 * Layout wrapper cho các trang có header/footer
 * Auth pages không có layout wrapper
 */

// Main router configuration with scroll restoration
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
    path: "/learning-path",
    element: (
      <Layout>
        <LearningPathPage />
      </Layout>
    ),
  },
  {
    path: "/roadmap-detail/:id",
    element: (
      <Layout>
        <LearningPathDetailPage />
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
    path: "/courses/:courseId/chapters/:chapterId",
    element: (
      <Layout>
        <ChapterDetailPage />
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
    path: "/verify-otp",
    element: <VerifyOtpPage />,
  },
  {
    path: "/oauth2/redirect",
    element: <OAuthCallback />,
  },
  {
    path: "/chatbox",
    element: (
      <LayoutNoFooter>
        <ChatbotPage />
      </LayoutNoFooter>
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
    path: "/exam-history",
    element: (
      <ProtectedRoute requiredRoles={["USER", "STAFF", "MANAGER", "ADMIN"]}>
        <Layout>
          <ExamHistoryPage />
        </Layout>
      </ProtectedRoute>
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
    path: "/manager/dashboard",
    element: (
      <ProtectedRoute requiredRoles={["MANAGER", "ADMIN"]}>
        <ManagerDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/manager/approval-requests",
    element: (
      <ProtectedRoute requiredRoles={["MANAGER", "ADMIN"]}>
        <ManagerApprovalRequestsPage />
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
    path: "/staff/create-question",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffCreateQuestion />
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
    path: "/staff/student-feedback",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffStudentFeedbackPage />
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
    path: "/staff/create-exam",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffCreateExamPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/staff/exams/:examId/edit",
    element: (
      <ProtectedRoute requiredRoles={["STAFF", "ADMIN"]}>
        <StaffUpdateExamPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exam/:examId/detail',
    element: <Layout><ExamDetailPage /></Layout>,
  },
  {
    path: '/exam/:examId/take',
    element: <ExamTakingPage />, // No layout for exam taking page to avoid distractions
  },
  {
    path: '/exam/:examId/overview',
    element: <Layout><ExamOverviewPage /></Layout>,
  },
  {
    path: '/exam-result/:resultId/review',
    element: <Layout><ExamReviewPage /></Layout>,
  },
  {
    path: '/forum',
    element: <Layout><ForumPage /></Layout>,
  },
  // Admin Routes - Chỉ dành cho ADMIN role
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
        <AdminDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/accounts',
    element: (
      <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
        <AdminManageAccountPage />
      </ProtectedRoute>
    ),
  },
  // Alias for backward compatibility
  {
    path: "/roadmap",
    element: (
      <Layout>
        <LearningPathPage />
      </Layout>
    ),
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
]);

/**
 * AppRouter Component - Router wrapper component
 * Sử dụng RouterProvider để cung cấp router cho toàn bộ app
 */
const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
