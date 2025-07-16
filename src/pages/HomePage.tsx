import React from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/layout/Hero';
import { PopularCourses } from '../components/layout/PopularCourses';

/**
 * Home Page Component - Trang chủ của website
 * Hiển thị banner chính, features và call-to-action
 * Responsive design với Tailwind CSS
 */
const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Popular Courses Section */}
      <PopularCourses />

      {/* CTA Section */}
      <section className="bg-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Sẵn sàng bắt đầu hành trình học tiếng Nhật?
          </h2>
          <p className="text-xl mb-8 text-red-100">
            Tham gia cùng hàng nghìn học viên đã tin tưởng 日本語Learning
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Đăng ký miễn phí ngay
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
