import { ApiResponse } from "@/types/api";
import { BaseService } from "./base.service";
import { LoginCredentials } from "@/types/User/LoginCredentials";
import { LoginResponse } from "@/types/User/LoginResponse";
import { TokenCredentials } from "@/types/User/TokenCredentials";


export class AuthService extends BaseService {
    async login(data: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
        return await this.post("/auth/login", data);
    }
    async refreshToken(refreshToken: string): Promise<ApiResponse<TokenCredentials>> {
        return await this.post("/auth/refresh-token",{refreshToken});
    }
}