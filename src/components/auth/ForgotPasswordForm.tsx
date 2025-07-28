import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BookOpen, Mail, AlertCircle, Send, ArrowLeft } from "lucide-react"
import authService from "../../services/authService"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    // Clear message when user starts typing
    if (message) {
      setMessage("")
      setIsSuccess(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await authService.forgotPassword(email)

      if (response.success) {
        localStorage.setItem("email", email)
        setIsSuccess(true)
        setMessage(response.message || "Đã gửi email xác thực đặt lại mật khẩu.")
        // Navigate after showing success message for 2 seconds
        setTimeout(() => {
          navigate("/verify-otp", { state: { from: "forgot-password", email } })
        }, 2000)
      } else {
        setMessage(response.message || "Có lỗi xảy ra. Vui lòng thử lại.")
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        setMessage(axiosError.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.")
      } else {
        setMessage("Lỗi kết nối. Vui lòng thử lại.")
      }
      console.error("Forgot password error:", error)
    } finally {
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
                Khôi phục tài khoản
                <br />
                <span className="text-red-200">học tiếng Nhật</span>
              </h2>
              <p className="text-red-100 text-lg leading-relaxed">
                Đừng lo lắng! Chúng tôi sẽ giúp bạn lấy lại quyền truy cập và tiếp tục hành trình học tập
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-red-200 text-sm">Hỗ trợ</div>
              </div>
              <div>
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-red-200 text-sm">Học viên</div>
              </div>
              <div>
                <div className="text-2xl font-bold">Safe</div>
                <div className="text-red-200 text-sm">Bảo mật</div>
              </div>
            </div>
          </div>

          {/* Decorative Japanese Characters */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-10">
            <div className="text-9xl font-bold">
              復<br/>旧<br/>中
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
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

          <div className="bg-white rounded-2xl shadow-xl p-6">
            {/* Back Button */}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Quên mật khẩu?</h2>
              <p className="text-gray-600">Đừng lo lắng! Nhập email và chúng tôi sẽ gửi link đặt lại cho bạn</p>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`border rounded-lg p-3 flex items-center gap-2 mb-6 ${
                isSuccess 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              }`}>
                <AlertCircle className={`h-4 w-4 flex-shrink-0 ${
                  isSuccess ? "text-green-500" : "text-red-500"
                }`} />
                <span className={`text-sm ${
                  isSuccess ? "text-green-600" : "text-red-600"
                }`}>{message}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Nhập địa chỉ email của bạn"
                    value={email}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    disabled={isLoading}
                  />
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
                    Đang gửi email...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" />
                    Gửi link đặt lại
                  </div>
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Cần trợ giúp?</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Kiểm tra thư mục spam/rác nếu không thấy email</li>
                <li>• Link đặt lại sẽ hết hạn sau 24 giờ</li>
                <li>• Liên hệ hỗ trợ nếu vẫn gặp vấn đề</li>
              </ul>
            </div>

            {/* Japanese Learning Motivation */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 text-center mt-6">
              <div className="text-2xl mb-2">🔑</div>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-red-600">大丈夫!</span> (Daijoubu!)
              </p>
              <p className="text-xs text-gray-500 mt-1">Đừng lo! Chúng tôi sẽ giúp bạn quay lại học tập.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
