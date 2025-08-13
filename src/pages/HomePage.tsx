import React from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/layout/Hero';
import { PopularCourses } from '../components/layout/PopularCourses';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Home Page Component - Trang chủ của website
 * Hiển thị banner chính, features và call-to-action
 * Responsive design với Tailwind CSS
 */
const HomePage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Popular Courses Section */}
      <PopularCourses />

      {/* CTA Section */}
      <section className="bg-red-600 text-white py-16">
        <div className="container mx-auto px-0 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-xl mb-8 text-red-100">
            {t('home.ctaDescription')}
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {t('home.ctaButton')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
