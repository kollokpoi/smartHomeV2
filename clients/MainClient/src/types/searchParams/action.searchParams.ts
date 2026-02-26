import type { BaseFilters } from ".";

export interface ActionFilters extends BaseFilters {
    deviceId?: string;
    method?: string;
    minTimeout?: number;
    maxTimeout?: number;
    minCallCount?: number;
    lastCallFrom?: Date;
    lastCallTo?: Date;
    hasError?: boolean | string;
}