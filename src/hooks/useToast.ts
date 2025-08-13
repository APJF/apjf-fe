import React from 'react'

import type { ToastContextType } from '@/types/ui';

export const ToastContext = React.createContext<ToastContextType | null>(null)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
