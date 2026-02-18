export interface ApiSuccessResponse<T> {
  data: T
  message?: string
  success: true
  timestamp?: string
}