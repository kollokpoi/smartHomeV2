export type DeviceStatus = "online" | "offline" | "maintenance";

export const DEVICE_STATUS = {
  online: "online",
  offline: "offline",
  maintenance: "maintenance",
} as const;

export const DEVICE_STATUSES_ARRAY = Object.values(DEVICE_STATUS);

export const DEVICE_STATUSES_LABELS: Record<DeviceStatus, string> = {
  online: "В сети",
  offline: "Отключен",
  maintenance: "В апдейте",
};

export const DEVICE_STATUSES_SEVERITY: Record<DeviceStatus, string> = {
  online: "success",
  offline: "danger",
  maintenance: "warning",
};

export const getDeviceSeverity = (status: DeviceStatus): string => {
  const map = {
    online: "success",
    offline: "danger",
    maintenance: "warning",
  };
  return map[status] || "secondary";
};

export const getDeviceLabel = (status: DeviceStatus): string => {
  const map = {
    online: "В сети",
    offline: "Отключен",
    maintenance: "В апдейте",
  };
  return map[status] || "Неизвестно";
};
