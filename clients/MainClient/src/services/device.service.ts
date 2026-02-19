import type { DeviceFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiPaginationResponse } from "@/types/api";
import { Device, type DeviceAttributes } from "@/types/dto";

class DeviceService extends BaseService {
    async getList(
        params?: PaginatedRequest<DeviceFilters>, 
        config?: AxiosRequestConfig
    ): Promise<ApiPaginationResponse<Device[]>> {
        const response = await this.get<DeviceAttributes[]>(
            '/devicawdes/', 
            {
                ...config,
                params
            }
        )
        
        return response as ApiPaginationResponse<Device[]>
    }
}

export const deviceService = new DeviceService()