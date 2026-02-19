import type { DeviceFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import { VoiceCommand, type VoiceCommandAttributes } from "@/types/dto";

class VoiceCommandService extends BaseService {
    async getList(params?: PaginatedRequest<DeviceFilters>, config?: AxiosRequestConfig):
        Promise<ApiResponse<PaginatedResponse<VoiceCommand>>> {
        const response = await this.get<PaginatedResponse<VoiceCommandAttributes>>('/voice-commands', {
            params,
            ...config,
        })
        if (response.success) {
            response.data.items = response.data.items.map((item) => new VoiceCommand(item))
        }
        return response as ApiResponse<PaginatedResponse<VoiceCommand>>
    }
}

export const voiceCommandService = new VoiceCommandService()