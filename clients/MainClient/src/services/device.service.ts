import type { DeviceFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiPaginationResponse } from "@/types/api";
import { Device, type DeviceAttributes } from "@/types/dto";
import { PaginationParamsFactory } from "@/lib/pagination/factory";

class DeviceService extends BaseService {
    async getList(params?: PaginatedRequest<DeviceFilters>, config?: AxiosRequestConfig):
        Promise<ApiPaginationResponse<Device[]>> {
        const searchParams = PaginationParamsFactory.createDevice(params);
        const response = await this.get<DeviceAttributes[]>(`/devices?${searchParams.toQueryString()}`, config)
        if (response.success) {
            response.data = response.data.map((item) => new Device(item))
        }
        return response as ApiPaginationResponse<Device[]>
    }
}

export const deviceService = new DeviceService()