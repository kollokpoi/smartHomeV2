import type {ActionParameterFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiPaginationResponse } from "@/types/api";
import { ActionParameter, type ActionParameterAttributes } from "@/types/dto";

class ActionParameterService extends BaseService {
    async getList(
        params?: PaginatedRequest<ActionParameterFilters>,
        config?: AxiosRequestConfig
    ): Promise<ApiPaginationResponse<ActionParameter[]>> {
        const response = await this.get<ActionParameterAttributes[]>(
            '/action-parameters/',
            {
                ...config,
                params
            }
        )

        return response as ApiPaginationResponse<ActionParameter[]>
    }
}

export const actionParameterService = new ActionParameterService()