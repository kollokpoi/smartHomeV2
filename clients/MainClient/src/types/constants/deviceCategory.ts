export type DeviceCategory = "camera" | "sensor" | "controller" | "other";

export const DEVICE_CATEGORY = {
    camera: "camera",
    sensor: "sensor",
    controller: "controller",
    other: "other",
} as const;

export const DEVICE_CATEGORY_ARRAY = Object.values(DEVICE_CATEGORY);

export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
    camera: "Камера",
    sensor: "Датчик",
    controller: "Контроллер",
    other: "Другое",
};

export const DEVICE_CATEGORY_SEVERITY: Record<DeviceCategory, string> = {
    camera: "info",
    sensor: "success",
    controller: "warning",
    other: "secondary",
};

export const getDeviceCategorySeverity = (status: DeviceCategory): string => {
  const map = {
    camera: "info",
    sensor: "success",
    controller: "warning",
    other: "secondary",
  };
  return map[status] || "secondary";
};

export const getDeviceCategoryLabel = (status: DeviceCategory): string => {
  const map = {
    camera: "Камера",
    sensor: "Датчик",
    controller: "Контроллер",
    other: "Другое",
  };
  return map[status] || "Другое";
};
