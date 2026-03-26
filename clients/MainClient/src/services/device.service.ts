import type { DeviceFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiPaginationResponse, ApiResponse } from "@/types/api";
import { Device, type DeviceAttributes } from "@/types/dto";

class DeviceService extends BaseService {
  async getList(
    params?: PaginatedRequest<DeviceFilters>,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Device[]>> {
    const response = await this.get<DeviceAttributes[]>("/devices/", {
      ...config,
      params,
    });
    if (response.success) {
      response.data = response.data.map((item) => new Device(item));
    }

    return response as ApiPaginationResponse<Device[]>;
  }
  async getDevice(
    id?: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Device>> {
    const response = await this.get<DeviceAttributes>(`/devices/${id}`, {
      ...config,
    });
    if (response.success) {
      response.data = new Device(response.data);
    }

    return response as ApiResponse<Device>;
  }

  async createDevice(
    data: DeviceAttributes,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Device>> {
    const response = await this.post<DeviceAttributes>(
      "/devices/",
      data,
      {
        ...config,
      },
    );
    if (response.success) {
      response.data = new Device(response.data);
    }

    return response as ApiResponse<Device>;
  }
  async updateDevice(
    id: string,
    data: DeviceAttributes,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<Device>> {
    const response = await this.put<DeviceAttributes>(`/devices/${id}`, data, {
      ...config,
    });
    if (response.success) {
      response.data = new Device(response.data);
    }

    return response as ApiResponse<Device>;
  }

  async deleteDevice(id: string): Promise<ApiResponse<any>> {
    const response = await this.delete(`/devices/${id}`);
    return response;
  }
}

export const deviceService = new DeviceService();
