import { TokenCredentials } from "./TokenCredentials";
import { User } from "./User";

export interface LoginResponse {
    user: User,
    tokens: TokenCredentials
}