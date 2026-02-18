import type { ApiResponse } from '@/types/api'
import { apiService } from './api.service'
import type { AxiosRequestConfig } from 'axios'


export abstract class BaseService {
  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiService.get<T>(url, config)
  }

  protected async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiService.post<T>(url, data, config)
  }

  protected async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiService.put<T>(url, data, config)
  }

  protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiService.delete<T>(url, config)
  }
}
