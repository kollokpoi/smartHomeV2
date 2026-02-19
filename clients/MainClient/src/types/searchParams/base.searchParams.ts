export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface BaseFilters {
    search?: string;
    isActive?: boolean | string;
}

export type PaginatedRequest<TFilters = Record<string, any>> = PaginationParams & TFilters