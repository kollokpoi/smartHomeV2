import type { ActionFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import { ActionParameter, type ActionParameterAttributes } from "@/types/dto";

class ActionParameterService extends BaseService {
    async getList(params?: PaginatedRequest<ActionFilters>, config?: AxiosRequestConfig):
        Promise<ApiResponse<PaginatedResponse<ActionParameter>>> {
        const response = await this.get<PaginatedResponse<ActionParameterAttributes>>('/action-parameters', {
            params,
            ...config,
        })
        if (response.success) {
            response.data.items = response.data.items.map((item) => new ActionParameter(item))
        }
        return response as ApiResponse<PaginatedResponse<ActionParameter>>
    }
}

export const actionParameterService = new ActionParameterService()