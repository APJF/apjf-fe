import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from "lucide-react"

/**
 * Footer Component - Chân trang của website
 * Thiết kế mới cho nền tảng học tiếng Nhật
 * Responsive design với Tailwind CSS
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Học tập",
      links: [
        { href: "/courses", label: "Tất cả khóa học" },
        { href: "/hiragana", label: "Hiragana" },
        { href: "/katakana", label: "Katakana" },
        { href: "/kanji", label: "Kanji" },
        { href: "/grammar", label: "Ngữ pháp" },
      ],
    },
    {
      title: "Thực hành",
      links: [
        { href: "/flashcards", label: "Thẻ từ" },
        { href: "/quizzes", label: "Trắc nghiệm" },
        { href: "/speaking", label: "Nói" },
        { href: "/listening", label: "Nghe" },
        { href: "/writing", label: "Viết" },
      ],
    },
    {
      title: "Tài nguyên",
      links: [
        { href: "/dictionary", label: "Từ điển" },
        { href: "/blog", label: "Blog" },
        { href: "/culture", label: "Văn hóa" },
        { href: "/news", label: "Tin tức Nhật" },
        { href: "/community", label: "Cộng đồng" },
      ],
    },
    {
      title: "Hỗ trợ",
      links: [
        { href: "/help", label: "Trung tâm trợ giúp" },
        { href: "/contact", label: "Liên hệ" },
        { href: "/privacy", label: "Chính sách bảo mật" },
        { href: "/terms", label: "Điều khoản sử dụng" },
        { href: "/faq", label: "FAQ" },
      ],
    },
  ]

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
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
              Làm chủ tiếng Nhật với nền tảng học tập toàn diện của chúng tôi. Từ sơ cấp đến nâng cao.
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
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} 日本語Learning. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
