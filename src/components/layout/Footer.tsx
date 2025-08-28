import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from "lucide-react"
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Footer Component - Chân trang của website
 * Thiết kế mới cho nền tảng học tiếng Nhật
 * Responsive design với Tailwind CSS
 */
const Footer: React.FC = () => {
  const { t } = useLanguage();

  const footerSections = [
    {
      title: t('footer.learning'),
      links: [
        { href: "/courses", label: t('footer.allCourses') },
      ],
    },
    {
      title: t('footer.resources'),
      links: [
        { href: "/forum", label: t('header.community') },
      ],
    },
  ]

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-0 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-6 w-6 text-red-500" />
              <span className="text-xl font-bold">
                <span className="text-red-500">日本語</span>
                <span>Learning</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              {t('footer.description')}
            </p>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Section */}
          <div>
            <h3 className="font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-400 text-sm">Số điện thoại: </span>
                <span className="text-white text-sm">0911353975</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Email hỗ trợ: </span>
                <span className="text-white text-sm">phuongpvhe170793@fpt.edu.vn</span>
              </li>
            </ul>
          </div>

          {/* Address Section */}
          <div>
            <h3 className="font-semibold mb-4">Địa chỉ</h3>
            <p className="text-gray-400 text-sm">
              Khu Giáo dục và Đào tạo - Khu Công nghệ cao Hòa Lạc - Km29 Đại lộ Thăng Long, xã Hòa Lạc, TP. Hà Nội
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
