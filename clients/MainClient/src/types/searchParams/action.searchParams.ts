import type { BaseFilters } from ".";

export interface ActionFilters extends BaseFilters {
    deviceId?: string;
    method?: string;
    minTimeout?: number;
    maxTimeout?: number;
    minCallCount?: number;
    lastCallFrom?: string;
    lastCallTo?: string;
    hasError?: boolean | string;
}