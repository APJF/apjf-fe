import { useToastContext } from './contexts'

export function useToast() {
  const { addToast } = useToastContext()

  const toast = {
    success: (title: string, message?: string, duration?: number) => {
      addToast({ type: 'success', title, message, duration })
    },
    error: (title: string, message?: string, duration?: number) => {
      addToast({ type: 'error', title, message, duration })
    }
  }

  return { toast }
}
