import type { BaseFilters } from ".";

export interface DeviceFilters extends BaseFilters {
    status?: string;
    minLastSeen?: Date;
    maxLastSeen?: Date;
    ip?: string;
}
