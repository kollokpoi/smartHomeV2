import type { ActionFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import { Action, type ActionAttributes } from "@/types/dto";

class ActionService extends BaseService {
    async getList(params?: PaginatedRequest<ActionFilters>, config?: AxiosRequestConfig):
        Promise<ApiResponse<PaginatedResponse<Action>>> {
        const response = await this.get<PaginatedResponse<ActionAttributes>>('/actions', {
            params,
            ...config,
        })
        if (response.success) {
            response.data.items = response.data.items.map((item) => new Action(item))
        }
        return response as ApiResponse<PaginatedResponse<Action>>
    }
}

export const actionService = new ActionService()