import type { ActionFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiPaginationResponse } from "@/types/api";
import { Action, type ActionAttributes } from "@/types/dto";

class ActionService extends BaseService {
    async getList(
        params?: PaginatedRequest<ActionFilters>,
        config?: AxiosRequestConfig
    ): Promise<ApiPaginationResponse<Action[]>> {
        const response = await this.get<ActionAttributes[]>(
            '/actions/',
            {
                ...config,
                params
            }
        )

        return response as ApiPaginationResponse<Action[]>
    }
}

export const actionService = new ActionService()