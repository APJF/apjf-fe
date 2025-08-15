import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import authService from "../../services/authService"
import { useToast } from "../../hooks/useToast"

interface RegisterData {
  email: string
  password: string
  confirmPassword: string
}

interface ValidationErrors {
  email?: string
  password?: string
  general?: string
}

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear errors when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors({})
    }
  }

  const registerWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setErrors({ general: "Mật khẩu xác nhận không khớp." })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await authService.register({
        email: formData.email,
        password: formData.password
      })

      if (response.success) {
        showToast("success", response.message)
        navigate("/verify-otp", {
          state: {
            email: formData.email,
            message: response.message,
            from: "register"
          }
        })
      } else {
        setErrors({ general: response.message || "Có lỗi không xác định xảy ra." })
      }
    } catch (error) {
      console.error("Register error:", error)
      setErrors({ general: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = () => {
    setIsLoading(true)
    setErrors({})
    try {
      // Chuyển hướng đến Google OAuth (giống như LoginForm)
      authService.initiateGoogleLogin()
    } catch (error) {
      setErrors({ general: "Không thể kết nối đến Google OAuth" })
      console.error("Google register error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[420px] flex">
      {/* Left Side - Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
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
                Bắt đầu hành trình
                <br />
                <span className="text-red-200">học tiếng Nhật</span>
              </h2>
              <p className="text-red-100 text-lg leading-relaxed">
                Tạo tài khoản miễn phí và khám phá thế giới tuyệt vời của ngôn ngữ và văn hóa Nhật Bản
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
              新<br/>始<br/>め
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">日本語Learning</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-4">
            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Tạo tài khoản mới!</h2>
              <p className="text-gray-600">Đăng ký để bắt đầu hành trình học tiếng Nhật của bạn</p>
            </div>

            {/* Error Messages */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-6">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600">{errors.general}</span>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={registerWithEmail} className="space-y-5">
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
                    className={`w-full pl-11 pr-4 h-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
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
                    className={`w-full pl-11 pr-11 h-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
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
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-11 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang đăng ký...
                  </div>
                ) : (
                  "Đăng ký"
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

            {/* Google Register Button */}
            <button
              onClick={handleGoogleRegister}
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
              Tiếp tục với Google
            </button>

            {/* Login link */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>

            {/* Japanese Learning Motivation */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 text-center mt-4">
              <div className="text-2xl mb-2">🎌</div>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-red-600">ようこそ!</span> (Youkoso!)
              </p>
              <p className="text-xs text-gray-500 mt-1">Chào mừng bạn đến với cộng đồng!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
