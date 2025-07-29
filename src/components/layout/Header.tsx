"use client"

import { useState } from "react"
import { Link } from 'react-router-dom';
import { Menu, X, BookOpen } from "lucide-react"
import { AuthSection } from "./AuthSection";
import { NotificationDropdown } from "../ui/NotificationDropdown";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'ja'>('vi')

  const navItems = [
    { href: "/", label: "Trang chủ" },
    { href: "/courses", label: "Khóa Học" },
    { href: "/roadmap", label: "Lộ trình học" },
    { href: "/about", label: "Giới thiệu" },
    { href: "/dictionary", label: "Cộng Đồng" },
    { href: "/chatbot", label: "Học với AI" },
    { href: "/contact", label: "Liên hệ" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-red-600" />
          <span className="text-xl font-bold">
            <span className="text-red-600">日本語</span>
            <span className="text-gray-900">Learning</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href} className="text-sm font-medium transition-colors hover:text-red-600">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          {/* Language Toggle */}
          <div className="flex items-center">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentLanguage('vi')}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  currentLanguage === 'vi' 
                    ? 'bg-white text-red-600 font-semibold shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tiếng Việt
              </button>
              <button
                onClick={() => setCurrentLanguage('ja')}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  currentLanguage === 'ja' 
                    ? 'bg-white text-red-600 font-semibold shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                日本語
              </button>
            </div>
          </div>
          
          <NotificationDropdown />
          <AuthSection />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-2">
          {/* Mobile Language Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentLanguage('vi')}
              className={`px-2 py-1 rounded-md text-xs transition-all ${
                currentLanguage === 'vi' 
                  ? 'bg-white text-red-600 font-semibold shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              VI
            </button>
            <button
              onClick={() => setCurrentLanguage('ja')}
              className={`px-2 py-1 rounded-md text-xs transition-all ${
                currentLanguage === 'ja' 
                  ? 'bg-white text-red-600 font-semibold shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              JP
            </button>
          </div>
          
          <NotificationDropdown />
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block text-sm font-medium transition-colors hover:text-red-600"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="md:hidden px-4 pt-2">
              <AuthSection />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
