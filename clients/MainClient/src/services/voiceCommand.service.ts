import type { VoiceCommandFilters, PaginatedRequest } from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiPaginationResponse } from "@/types/api";
import { VoiceCommand, type VoiceCommandAttributes } from "@/types/dto";

class VoiceCommandService extends BaseService {
    async getList(
        params?: PaginatedRequest<VoiceCommandFilters>,
        config?: AxiosRequestConfig
    ): Promise<ApiPaginationResponse<VoiceCommand[]>> {
        const response = await this.get<VoiceCommandAttributes[]>(
            '/voice-commands/',
            {
                ...config,
                params
            }
        )

        return response as ApiPaginationResponse<VoiceCommand[]>
    }
}

export const voiceCommandService = new VoiceCommandService()