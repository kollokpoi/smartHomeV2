import type { ActionFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiPaginationResponse, ApiResponse } from "@/types/api";
import { Action, type ActionAttributes } from "@/types/dto";

class ActionService extends BaseService {
    async getList(
        params?: PaginatedRequest<ActionFilters>,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<Action[]>> {
        const response = await this.get<ActionAttributes[]>(
            '/actions/',
            {
                ...config,
                params
            }
        )
        if (response.success) {
            response.data = response.data.map(item => new Action(item))
        }

        return response as ApiPaginationResponse<Action[]>
    }
    async getAction(
        id: string,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<Action>> {
        const response = await this.get<ActionAttributes>(
            `/actions/${id}/`,
            {
                ...config,
            }
        )
        if (response.success) {
            response.data = new Action(response.data)
        }
        return response as ApiResponse<Action>
    }
    async deleteAction(id: string): Promise<ApiResponse<any>> {
        const response = await this.delete(`/actions/${id}`)
        return response;
    }
}

export const actionService = new ActionService()