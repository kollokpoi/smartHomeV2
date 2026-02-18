import type { ValidationError } from "../ValidationError"

export interface ApiErrorResponse {
  message: string
  code?: string
  errors?: ValidationError[]
  statusCode?: number
  timestamp?: string
  success: false
}