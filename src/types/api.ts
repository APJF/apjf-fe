export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: number
}

export interface ApiError {
  success: false
  message: string
  error?: string
  timestamp: number
}
