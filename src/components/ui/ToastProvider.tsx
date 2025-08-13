import React, { useState, useMemo, useCallback } from 'react'
import { ToastContext } from '../../hooks/useToast'
import type { ToastProps, ToastType } from '../../types/ui'
import { Toast } from './Toast'

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastProps = {
      id,
      type,
      message,
      onClose: removeToast
    }
    setToasts(prev => [...prev, newToast])
  }, [removeToast])

  const contextValue = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
