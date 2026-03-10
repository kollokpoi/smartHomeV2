import type { BaseFilters } from ".";
import type { ContentType, ParameterLocation, ParameterType } from "../constants/parameterLocation";

export interface ActionParameterFilters extends BaseFilters {
    actionId?: string;
    location?: ParameterLocation;
    type?: ParameterType;
    required?: boolean | string;
    contentType?: ContentType;
}