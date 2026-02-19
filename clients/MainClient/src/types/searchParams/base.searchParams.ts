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

export interface PaginatedRequest<TFilters = Record<string, any>> extends PaginationParams {
    filters?: TFilters;
}