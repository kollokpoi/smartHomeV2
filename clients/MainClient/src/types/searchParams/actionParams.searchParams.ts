import type { BaseFilters } from ".";

export interface ActionParameterFilters extends BaseFilters {
    actionId?: string;
    location?: string;
    type?: string;
    required?: boolean | string;
    contentType?: string;
}