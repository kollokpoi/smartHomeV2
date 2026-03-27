import type { ActionFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ActionCallResult, ApiPaginationResponse, ApiResponse } from "@/types/api";
import { Action, type ActionAttributes } from "@/types/dto";
import { DelayedTask } from "@/types/common/DelayedTask";

class ActionService extends BaseService {
  async getList(
    params?: PaginatedRequest<ActionFilters>,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Action[]>> {
    const response = await this.get<ActionAttributes[]>("/actions/", {
      ...config,
      params,
    });
    if (response.success) {
      response.data = response.data.map((item) => new Action(item));
    }

    return response as ApiPaginationResponse<Action[]>;
  }
  async getAction(
    id: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Action>> {
    const response = await this.get<ActionAttributes>(`/actions/${id}/`, {
      ...config,
    });
    if (response.success) {
      response.data = new Action(response.data);
    }
    return response as ApiResponse<Action>;
  }

  async callAction(
    id: string,
    delay?: number,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<ActionCallResult>> {
    const response = await this.post<ActionCallResult>(`/actions/${id}/execute`, {
      delay,
      ...config,
    });
    return response as ApiResponse<ActionCallResult>;
  }

  async updateAction(
    id: string,
    data: ActionAttributes,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Action>> {
    const response = await this.put<ActionAttributes>(`/actions/${id}`, data, {
      ...config,
    });
    if (response.success) {
      response.data = new Action(response.data);
    }

    return response as ApiResponse<Action>;
  }

  async createAction(
    data: ActionAttributes,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Action>> {
    const response = await this.post<ActionAttributes>(`/actions/`, data, {
      ...config,
    });
    if (response.success) {
      response.data = new Action(response.data);
    }

    return response as ApiResponse<Action>;
  }
  async registerCall(
    id: string,
    data: { responseStatus?: number; errorMessage?: string },
  ): Promise<ApiResponse<any>> {
    const response = await this.post(`/actions/${id}/register-call/`, data);
    return response;
  }
  async deleteAction(id: string): Promise<ApiResponse<any>> {
    const response = await this.delete(`/actions/${id}`);
    return response;
  }

  async getDelayedActions(params?: { actionId?: string; deviceId?: string }): Promise<ApiResponse<DelayedTask[]>> {
    const response = await this.get<DelayedTask[]>('/actions/delayed', { params });
    return response;
  }

  async cancelDelayedTask(taskId: string): Promise<ApiResponse<null>> {
    const response = await this.delete<null>(`/actions/delayed/${taskId}`);
    return response;
  }

  async cancelAllDelayedByAction(actionId: string): Promise<ApiResponse<null>> {
    const response = await this.delete<null>(`/actions/delayed/action/${actionId}`);
    return response;
  }
}

export const actionService = new ActionService();
