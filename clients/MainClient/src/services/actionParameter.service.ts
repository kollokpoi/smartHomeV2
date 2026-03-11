import type {
  ActionParameterFilters,
  PaginatedRequest,
} from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiPaginationResponse, ApiResponse } from "@/types/api";
import { ActionParameter, type ActionParameterAttributes } from "@/types/dto";

class ActionParameterService extends BaseService {
  async getList(
    params?: PaginatedRequest<ActionParameterFilters>,
    config?: AxiosRequestConfig,
  ): Promise<ApiPaginationResponse<ActionParameter[]>> {
    const response = await this.get<ActionParameterAttributes[]>(
      "/action-parameters/",
      {
        ...config,
        params,
      },
    );

    return response as ApiPaginationResponse<ActionParameter[]>;
  }

  async getActionParameter(
    id: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<ActionParameter>> {
    const response = await this.get<ActionParameterAttributes>(
      `/action-parameters/${id}/`,
      {
        ...config,
      },
    );
    if (response.success) {
      response.data = new ActionParameter(response.data);
    }
    return response as ApiResponse<ActionParameter>;
  }

  async updateActionParameter(
    id: string,
    data: ActionParameterAttributes,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<ActionParameter>> {
    const response = await this.put<ActionParameterAttributes>(
      `/action-parameters/${id}`,
      data,
      {
        ...config,
      },
    );
    if (response.success) {
      response.data = new ActionParameter(response.data);
    }

    return response as ApiResponse<ActionParameter>;
  }

  async createActionParameter(
    data: ActionParameterAttributes,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<ActionParameter>> {
    const response = await this.post<ActionParameterAttributes>(
      `/action-parameters/`,
      data,
      {
        ...config,
      },
    );
    if (response.success) {
      response.data = new ActionParameter(response.data);
    }

    return response as ApiResponse<ActionParameter>;
  }

  async deleteActionParameter(id: string): Promise<ApiResponse<any>> {
    const response = await this.delete(`/action-parameters/${id}`);
    return response;
  }
}

export const actionParameterService = new ActionParameterService();
