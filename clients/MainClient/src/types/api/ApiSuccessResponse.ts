import type { Pagination } from "."

export interface ApiSuccessResponse<T> {
  data: T
  message?: string
  success: true
  timestamp?: string
}

export interface ApiPaginationResponse<T> extends ApiSuccessResponse<T> {
  pagination: Pagination
}