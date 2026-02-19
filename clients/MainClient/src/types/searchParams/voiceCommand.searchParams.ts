import type { BaseFilters } from ".";

export interface VoiceCommandFilters extends BaseFilters {
    actionId?: string;
    deviceId?: string;
    language?: string;
    minPriority?: number;
    maxPriority?: number;
    minUsageCount?: number;
    lastUsedFrom?: string;
    lastUsedTo?: string;
}