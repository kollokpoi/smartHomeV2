import type { PaginationParams, PaginatedRequest } from '@/types/searchParams'

export class PaginationParamsFactory {
  // Для устройств
  static createDevice(params?: PaginatedRequest<any>): PaginationParams & Record<string, any> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'sortOrder',
      sortOrder = 'ASC',
      ...filters
    } = params || {}

    return {
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder: String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      ...filters 
    }
  }

  static createAction(params?: PaginatedRequest<any>): PaginationParams & Record<string, any> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt', 
      sortOrder = 'ASC',
      ...filters
    } = params || {}

    return {
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder: String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      ...filters
    }
  }

  static createVoiceCommand(params?: PaginatedRequest<any>): PaginationParams & Record<string, any> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'priority',
      sortOrder = 'ASC',
      ...filters
    } = params || {}

    return {
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder: String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      ...filters
    }
  }
}