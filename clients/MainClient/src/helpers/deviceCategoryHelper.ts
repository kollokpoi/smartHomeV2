import { DEVICE_CATEGORY_ARRAY, DEVICE_CATEGORY_LABELS, DEVICE_CATEGORY_SEVERITY } from "@/types/constants";

export const DeviceCategoryHelper = {
  getDeviceCategoryOptions: () =>
    DEVICE_CATEGORY_ARRAY.map((category) => ({
      value: category,
      label: DEVICE_CATEGORY_LABELS[category],
      severity: DEVICE_CATEGORY_SEVERITY[category]
    })),
};
