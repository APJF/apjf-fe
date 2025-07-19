import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BookOpen, Lock, Eye, EyeOff, AlertCircle, Shield, ArrowLeft } from "lucide-react"
import authService from "../../services/authService"

interface ResetPasswordData {
  otp: string
  newPassword: string
  confirmPassword: string
}

export function ResetPasswordForm() {
  const [formData, setFormData] = useState<ResetPasswordData>({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Chỉ cho phép nhập số cho OTP
    if (name === "otp") {
      const numericValue = value.replace(/\D/g, "").slice(0, 6)
      setFormData((prev) => ({ ...prev, [name]: numericValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Clear message when user starts typing
    if (message) setMessage("")
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    
    const email = localStorage.getItem("email")
    
    if (!email) {
      setMessage("Email không tìm thấy. Vui lòng thực hiện lại quá trình quên mật khẩu.")
      setIsLoading(false)
      return
    }
    
    try {
      const response = await authService.resetPassword({
        email,
        otp: formData.otp,
        newPassword: formData.newPassword
      })

      if (response.success) {
        // Clear email from localStorage since password reset is complete
        localStorage.removeItem("email")
        // Store success message for login page
        localStorage.setItem("loginMessage", response.message || "Đặt lại mật khẩu thành công.")
        localStorage.setItem("loginMessageType", "success")
        // Redirect directly to login page
        navigate("/login")
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
      console.error("Reset password error:", error)
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
                Bảo mật tài khoản
                <br />
                <span className="text-red-200">học tiếng Nhật</span>
              </h2>
              <p className="text-red-100 text-lg leading-relaxed">
                Tạo mật khẩu mới an toàn để bảo vệ tài khoản và tiếp tục học tập một cách yên tâm
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold">SSL</div>
                <div className="text-red-200 text-sm">Mã hóa</div>
              </div>
              <div>
                <div className="text-2xl font-bold">Safe</div>
                <div className="text-red-200 text-sm">An toàn</div>
              </div>
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-red-200 text-sm">Bảo vệ</div>
              </div>
            </div>
          </div>

          {/* Decorative Japanese Characters */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-10">
            <div className="text-9xl font-bold">
              新<br/>密<br/>码
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
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
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
              <p className="text-gray-600">Nhập mã OTP và mật khẩu mới để đặt lại mật khẩu</p>
            </div>

            {/* Error Message */}
            {message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-6">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600">{message}</span>
              </div>
            )}

            {/* Reset Password Form */}
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* OTP */}
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Mã OTP
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Nhập mã OTP 6 số"
                    value={formData.otp}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">Nhập mã OTP 6 số đã được gửi đến email của bạn</p>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    required
                    placeholder="Nhập mật khẩu mới"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-11 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("new")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-11 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    Đang đặt lại mật khẩu...
                  </div>
                ) : (
                  "Đặt lại mật khẩu"
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Lưu ý:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Mã OTP có hiệu lực trong 10 phút</li>
                <li>• Mật khẩu mới phải có ít nhất 6 ký tự</li>
                <li>• Mật khẩu xác nhận phải trùng với mật khẩu mới</li>
                <li>• Kiểm tra email nếu chưa nhận được mã OTP</li>
              </ul>
            </div>

            {/* Japanese Learning Motivation */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 text-center mt-6">
              <div className="text-2xl mb-2">🔄</div>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-red-600">新しい始まり!</span> (Atarashii hajimari!)
              </p>
              <p className="text-xs text-gray-500 mt-1">Khởi đầu mới! Hãy tiếp tục hành trình học tập.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
