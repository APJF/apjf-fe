import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import type { LoginCredentials } from "../../types/auth"
import { useToast } from "../../hooks/useToast"
import authService from "../../services/authService"

export function LoginForm() {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isUnverified, setIsUnverified] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (message) {
      setMessage("")
      setIsUnverified(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    setIsUnverified(false)
    try {
      const data = await login(formData)
      if (data.success) {
        showToast("success", data.message)
        navigate("/")
      } else {
        setMessage(data.message || "Email hoặc mật khẩu không đúng.")
        if (data.message === "Tài khoản chưa được xác thực.") {
          setIsUnverified(true)
        }
      }
    } catch (error) {
      setMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVerification = async () => {
    setIsLoading(true)
    try {
      const response = await authService.sendVerificationOtp(formData.email)
      if (response.success) {
        showToast("success", response.message)
        navigate("/verify-otp", {
          state: {
            email: formData.email,
            message: response.message
          }
        })
      } else {
        setMessage(response.message || "Gửi OTP thất bại.")
      }
    } catch (error) {
      setMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.")
      console.error("Send verification OTP error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    setIsLoading(true)
    setMessage("")
    try {
      // Chuyển hướng đến Google OAuth
      authService.initiateGoogleLogin()
      // Không set setIsLoading(false) ở đây vì sẽ redirect
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Không thể kết nối đến Google OAuth"
      setMessage(errorMessage)
      console.error("Google login error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[400px] flex">
      {/* Left Side - Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">日本語Learning</h1>
              <p className="text-red-100 text-sm">Học tiếng Nhật hiệu quả</p>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Khám phá thế giới
                <br />
                <span className="text-red-200">tiếng Nhật</span>
              </h2>
              <p className="text-red-100 text-lg leading-relaxed">
                Tham gia cùng hàng nghìn học viên đang học tiếng Nhật và khám phá văn hóa Nhật Bản mỗi ngày
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-red-200 text-sm">Học viên</div>
              </div>
              <div>
                <div className="text-2xl font-bold">500+</div>
                <div className="text-red-200 text-sm">Bài học</div>
              </div>
              <div>
                <div className="text-2xl font-bold">98%</div>
                <div className="text-red-200 text-sm">Hài lòng</div>
              </div>
            </div>
          </div>

          {/* Decorative Japanese Characters */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-10">
            <div className="text-9xl font-bold">
              日<br/>本<br/>語
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">日本語Learning</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Chào mừng trở lại!</h2>
              <p className="text-gray-600">Đăng nhập để tiếp tục hành trình học tiếng Nhật của bạn</p>
            </div>

            {message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-6">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600">
                  {message}
                  {isUnverified && (
                    <button
                      type="button"
                      onClick={handleSendVerification}
                      className="font-semibold text-red-700 hover:underline ml-2"
                      disabled={isLoading}
                    >
                      Xác thực tài khoản
                    </button>
                  )}
                </span>
              </div>
            )}

            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Nhập email của bạn"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    maxLength={255}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-11 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    maxLength={255}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600">
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang đăng nhập...
                  </div>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-11 flex items-center justify-center gap-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Đăng nhập với Google
            </button>

            {/* Sign up link */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                  Đăng ký ngay
                </Link>
              </p>
            </div>

            {/* Japanese Learning Motivation */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 text-center mt-6">
              <div className="text-2xl mb-2">🎌</div>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-red-600">頑張って!</span> (Ganbatte!)
              </p>
              <p className="text-xs text-gray-500 mt-1">Chúc bạn học tốt!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
