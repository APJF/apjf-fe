import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BookOpen, ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react"
import authService from "../../services/authService"
import { useToast } from "../../hooks/useToast"

export function VerifyOtpForm() {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [otpType, setOtpType] = useState<'registration' | 'reset_password'>('registration')
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email)
      localStorage.setItem("email", location.state.email)
    } else {
      const storedEmail = localStorage.getItem("email")
      if (storedEmail) {
        setEmail(storedEmail)
      } else {
        setMessage("Không tìm thấy email. Vui lòng thử lại.")
      }
    }

    // Set OTP type based on where user came from
    if (location.state?.from === "forgot-password") {
      setOtpType('reset_password')
    } else {
      setOtpType('registration')
    }
  }, [location.state])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setOtp(value)
    if (message) setMessage("")
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    if (!email) {
      setMessage("Email không tìm thấy. Vui lòng thực hiện lại.")
      setIsLoading(false)
      return
    }

    if (otp.length !== 6) {
      setMessage("Vui lòng nhập đầy đủ 6 chữ số của mã OTP.")
      setIsLoading(false)
      return
    }

    try {
      const response = await authService.verifyOtp({ email, otp })

      if (response.success) {
        showToast('success', response.message)
        localStorage.removeItem("email") // Clear stored email after successful verification
        
        const from = location.state?.from;
        if (from === "forgot-password") {
          navigate("/reset-password", { state: { email } })
        } else {
          navigate("/login")
        }
      } else {
        setMessage(response.message || "Mã OTP không hợp lệ.")
      }
    } catch (error) {
      setMessage("Lỗi kết nối. Vui lòng thử lại.")
      console.error("Verify OTP error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email) {
      setMessage("Email không tìm thấy. Vui lòng thực hiện lại.")
      return
    }

    setIsResending(true)
    setMessage("")

    try {
      // Use the new sendOtp method with proper type
      const response = await authService.sendOtp({ 
        email, 
        type: otpType 
      })
      
      if (response.success) {
        showToast('success', "Mã OTP mới đã được gửi đến email của bạn.")
        setOtp("") // Clear current OTP input
      } else {
        setMessage(response.message || "Không thể gửi lại mã OTP.")
      }
    } catch (error) {
      setMessage("Lỗi kết nối. Vui lòng thử lại.")
      console.error("Resend OTP error:", error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-700 to-red-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">日本語Learning</h1>
              <p className="text-red-100 text-sm">Học tiếng Nhật hiệu quả</p>
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Xác thực tài khoản
                <br />
                <span className="text-red-200">an toàn</span>
              </h2>
              <p className="text-red-100 text-lg leading-relaxed">
                Bảo vệ tài khoản của bạn là ưu tiên hàng đầu của chúng tôi.
              </p>
            </div>
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-10">
            <div className="text-9xl font-bold">
              安<br/>全<br/>性
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Xác thực OTP</h2>
              <p className="text-gray-600">
                Một mã OTP đã được gửi đến email <span className="font-medium text-red-600">{email}</span>.
              </p>
            </div>
            {message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 mb-6">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600">{message}</span>
              </div>
            )}
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Mã OTP
                </label>
                <div className="relative">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="------"
                    value={otp}
                    onChange={handleInputChange}
                    className="w-full text-center tracking-[0.5em] text-3xl font-semibold h-16 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-400"
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "Đang xác thực..." : "Xác thực"}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isResending || isLoading}
                >
                  {isResending ? "Đang gửi..." : "Gửi lại mã OTP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
