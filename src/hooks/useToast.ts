import React from 'react'

export type ToastType = 'success' | 'error' | 'warning'

export interface ToastContextType {
  showToast: (type: ToastType, message: string) => void
}

export const ToastContext = React.createContext<ToastContextType | null>(null)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
