import { useEffect, useState, useCallback } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import type { ToastData } from './contexts'

interface ToastProps {
  readonly toast: ToastData
  readonly onRemove: (id: string) => void
}

export function Toast({ toast, onRemove }: ToastProps) {
  const [progress, setProgress] = useState(100)
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = useCallback(() => {
    setIsRemoving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }, [onRemove, toast.id])

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!toast.duration) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (toast.duration! / 100)
        if (newProgress <= 0) {
          handleRemove()
          return 0
        }
        return newProgress
      })
    }, 100)

    return () => clearInterval(interval)
  }, [toast.duration, handleRemove])

  const baseStyles = 'relative overflow-hidden rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300 ease-in-out transform'
  const hiddenStyles = `${baseStyles} translate-x-full opacity-0 scale-95`
  const visibleTypeStyles = toast.type === 'success'
    ? 'bg-green-50/90 border-green-200 text-green-800'
    : 'bg-red-50/90 border-red-200 text-red-800'
  const visibleStyles = `${baseStyles} translate-x-0 opacity-100 scale-100 ${visibleTypeStyles}`
  
  const toastStyles = isRemoving || !isVisible ? hiddenStyles : visibleStyles

  const progressStyles = `absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear ${
    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`

  return (
    <div className={toastStyles}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold leading-5">{toast.title}</h4>
            {toast.message && (
              <p className="mt-1 text-sm opacity-90 leading-5">{toast.message}</p>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors duration-200"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className={progressStyles} style={{ width: `${progress}%` }} />
    </div>
  )
}
