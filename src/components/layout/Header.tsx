"use client"

import { useState } from "react"
import { Link } from 'react-router-dom';
import { Menu, X, BookOpen } from "lucide-react"
import { AuthSection } from "./AuthSection";
import { NotificationDropdown } from "../ui/NotificationDropdown";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
          <NotificationDropdown />
          <AuthSection />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-2">
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
