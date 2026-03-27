// services/speech.service.ts
import { BaseService } from "./base.service";
import type { AxiosRequestConfig } from "axios";
import type { ApiResponse } from "@/types/api";


export interface SpeechStatus {
    ready: boolean;
}

class SpeechService extends BaseService {
    async recognize(
        audioBlob: Blob,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<string>> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        
        const response = await this.post<string>(
            '/speech/recognize',
            formData,
            {
                ...config,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        
        return response;
    }
    
    async recognizeBase64(
        audioBase64: string,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<string>> {
        const response = await this.post<string>(
            '/speech/recognize-base64',
            { audio: audioBase64 },
            config
        );
        
        return response;
    }
    
    async getStatus(
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<SpeechStatus>> {
        const response = await this.get<SpeechStatus>(
            '/speech/recognize/status',
            config
        );
        
        return response;
    }
}

export const speechService = new SpeechService();