import type { BaseFilters } from ".";

export interface DeviceFilters extends BaseFilters {
    status?: string;
    minLastSeen?: string;
    maxLastSeen?: string;
    ip?: string;
    metadata?: string;
}
