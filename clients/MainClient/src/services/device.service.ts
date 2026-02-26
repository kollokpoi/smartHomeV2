import type { DeviceFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiPaginationResponse, ApiResponse } from "@/types/api";
import { Device, type DeviceAttributes } from "@/types/dto";

class DeviceService extends BaseService {
    async getList(
        params?: PaginatedRequest<DeviceFilters>,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<Device[]>> {
        const response = await this.get<DeviceAttributes[]>(
            '/devices/',
            {
                ...config,
                params
            }
        )
        if (response.success) {
            response.data = response.data.map(item => new Device(item))
        }

        return response as ApiPaginationResponse<Device[]>
    }
}

export const deviceService = new DeviceService()