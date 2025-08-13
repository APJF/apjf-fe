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
        { href: "/hiragana", label: t('footer.hiragana') },
        { href: "/katakana", label: t('footer.katakana') },
        { href: "/kanji", label: t('footer.kanji') },
        { href: "/grammar", label: t('footer.grammar') },
      ],
    },
    {
      title: t('footer.practice'),
      links: [
        { href: "/flashcards", label: t('footer.flashcards') },
        { href: "/quizzes", label: t('footer.quizzes') },
        { href: "/speaking", label: t('footer.speaking') },
        { href: "/listening", label: t('footer.listening') },
        { href: "/writing", label: t('footer.writing') },
      ],
    },
    {
      title: t('footer.resources'),
      links: [
        { href: "/dictionary", label: t('footer.dictionary') },
        { href: "/blog", label: t('footer.blog') },
        { href: "/culture", label: t('footer.culture') },
        { href: "/news", label: t('footer.news') },
        { href: "/community", label: t('header.community') },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { href: "/help", label: t('footer.helpCenter') },
        { href: "/contact", label: t('footer.contact') },
        { href: "/privacy", label: t('footer.privacy') },
        { href: "/terms", label: t('footer.terms') },
        { href: "/faq", label: t('footer.faq') },
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
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
