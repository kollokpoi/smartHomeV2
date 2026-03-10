import {
  CONTENT_TYPE_ARRAY,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_SEVERITY,
  PARAMETER_LOCATION_ARRAY,
  PARAMETER_LOCATION_LABELS,
  PARAMETER_LOCATION_SEVERITY,
  PARAMETER_TYPE_ARRAY,
  PARAMETER_TYPE_LABELS,
  PARAMETER_TYPE_SEVERITY,
} from "@/types/constants/parameterLocation";

export const ActionParameterHelper = {
  getLocationSelectOptions: () =>
    PARAMETER_LOCATION_ARRAY.map((parameter) => ({
      value: parameter,
      label: PARAMETER_LOCATION_LABELS[parameter],
      severity: PARAMETER_LOCATION_SEVERITY[parameter]
    })),

  getLocationOptions: () =>
    PARAMETER_LOCATION_ARRAY.map((parameter) => ({
      value: parameter,
      label: parameter,
    })),

  getTypeSelectOptions: () =>
    PARAMETER_TYPE_ARRAY.map((parameter) => ({
      value: parameter,
      label: PARAMETER_TYPE_LABELS[parameter],
      severity: PARAMETER_TYPE_SEVERITY[parameter]
    })),

  getTypeOptions: () =>
    PARAMETER_TYPE_ARRAY.map((parameter) => ({
      value: parameter,
      label: parameter,
    })),

  getContentTypeSelectOptions: () =>
    CONTENT_TYPE_ARRAY.map((parameter) => ({
      value: parameter,
      label: CONTENT_TYPE_LABELS[parameter],
      severity: CONTENT_TYPE_SEVERITY[parameter]
    })),

  getContentTypeOptions: () =>
    CONTENT_TYPE_ARRAY.map((parameter) => ({
      value: parameter,
      label: parameter,
    })),
};
