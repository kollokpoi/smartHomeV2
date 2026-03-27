import type {
  VoiceCommandFilters,
  PaginatedRequest,
} from "@/types/searchParams";
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type {
  ActionCallResult,
  ApiPaginationResponse,
  ApiResponse,
  BulkVoiceCommandCreate,
} from "@/types/api";
import { VoiceCommand, type VoiceCommandAttributes } from "@/types/dto";

class VoiceCommandService extends BaseService {
  async getList(
    params?: PaginatedRequest<VoiceCommandFilters>,
    config?: AxiosRequestConfig,
  ): Promise<ApiPaginationResponse<VoiceCommand[]>> {
    const response = await this.get<VoiceCommandAttributes[]>(
      "/voice-commands/",
      {
        ...config,
        params,
      },
    );

    if (response.success) {
      response.data = response.data.map((item) => new VoiceCommand(item));
    }

    return response as ApiPaginationResponse<VoiceCommand[]>;
  }

  async getVoiceCommand(
    id: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<VoiceCommand>> {
    const response = await this.get<VoiceCommandAttributes>(
      `/voice-commands/${id}/`,
      {
        ...config,
      },
    );
    if (response.success) {
      response.data = new VoiceCommand(response.data);
    }
    return response as ApiResponse<VoiceCommand>;
  }

  async updateVoiceCommand(
    id: string,
    data: VoiceCommandAttributes,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<VoiceCommand>> {
    const response = await this.put<VoiceCommandAttributes>(
      `/voice-commands/${id}`,
      data,
      {
        ...config,
      },
    );
    if (response.success) {
      response.data = new VoiceCommand(response.data);
    }

    return response as ApiResponse<VoiceCommand>;
  }

  async createVoiceCommand(
    data: VoiceCommandAttributes,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<VoiceCommand>> {
    const response = await this.post<VoiceCommandAttributes>(
      `/voice-commands/`,
      data,
      {
        ...config,
      },
    );
    if (response.success) {
      response.data = new VoiceCommand(response.data);
    }

    return response as ApiResponse<VoiceCommand>;
  }

  async bulkCreateVoiceCommand(
    data: BulkVoiceCommandCreate,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<VoiceCommand[]>> {
    const response = await this.post<VoiceCommandAttributes[]>(
      `/voice-commands/bulk`,
      data,
      {
        ...config,
      },
    );
    if (response.success) {
      response.data = response.data.map((x) => new VoiceCommand(x));
    }

    return response as ApiResponse<VoiceCommand[]>;
  }

  async callVoiceCommand(
    audioBlob: Blob,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<ActionCallResult>> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    const response = await this.post<ActionCallResult>(
      "/voice-commands/process",
      formData,
      {
        ...config,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response as ApiResponse<ActionCallResult>;
  }

  async deleteVoiceCommand(id: string): Promise<ApiResponse<any>> {
    const response = await this.delete(`/voice-commands/${id}`);
    return response;
  }
}

export const voiceCommandService = new VoiceCommandService();
