/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import router from '@/router'


import type { ApiErrorResponse, ApiResponse } from '@/types/api'

const API_BASE_URL = 'http://127.0.0.1:3000/api'

export class ApiService {
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const authStore = useAuthStore()
        const token = authStore.token

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isCancel(error)) {
          return Promise.reject(error)
        }

        const originalRequest = error.config
        const authStore = useAuthStore()

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const newToken = await authStore.refreshAccessToken()

            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.axiosInstance(originalRequest)
            }
          }  catch (refreshError) {
            authStore.logout()
            router.push('/login')
            return Promise.reject(refreshError)
          }
        }

        if (error.response?.status >= 400 && error.response?.status < 500) {
          const errorBox : ApiErrorResponse = {
            message:error.response.data.message,
            success: false,
            statusCode: error.response.status
          }
          return Promise.resolve(errorBox)
        }

        if (error.request) {
          return Promise.reject({
            message: 'Сервер не отвечает. Проверьте подключение к интернету',
          })
        }

        return Promise.reject({
          message: 'Произошла ошибка при выполнении запроса',
        })
      }
    )
  }

  // Общие CRUD методы для использования в специализированных сервисах
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
     try {
      const response =  await this.axiosInstance.get<ApiResponse<T>>(url, config)
      return response.data || response
    } catch (error: any) {
      if (error.success === false) {
        return error
      }
      if (axios.isCancel(error) || error.name === 'AbortError') {
        throw error
      }
      return {
        success: false,
        message: 'Неизвестная ошибка'
      }
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config)
      return response.data || response
    } catch (error: any) {
      if (error.success === false) {
        return error
      }
      if (axios.isCancel(error) || error.name === 'AbortError') {
        throw error
      }
      return {
        success: false,
        message: 'Неизвестная ошибка'
      }
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config)
      return response.data || response
    } catch (error: any) {
      if (error.success === false) {
        return error
      }
      if (axios.isCancel(error) || error.name === 'AbortError') {
        throw error
      }
      return {
        success: false,
        message: 'Неизвестная ошибка'
      }
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
     try {
      const response =  await this.axiosInstance.delete<ApiResponse<T>>(url, config)
      return response.data || response
    } catch (error: any) {
      if (error.success === false) {
        return error
      }
      if (axios.isCancel(error) || error.name === 'AbortError') {
        throw error
      }
      return {
        success: false,
        message: 'Неизвестная ошибка'
      }
    }
  }
}

// Экспортируем синглтон экземпляр
export const apiService = new ApiService()
