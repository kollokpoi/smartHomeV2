import type { ApiErrorResponse } from "./ApiErrorResponse";
import type { ApiSuccessResponse } from "./ApiSuccessResponse";

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse