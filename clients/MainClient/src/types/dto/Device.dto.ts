import type { Action, BaseAttributes, Metadata } from ".";
import type { ActionAttributes } from ".";
import type { DeviceStatus } from "../constants";
import { useNetworkStore } from "@/stores/modules/network.store";

export interface DeviceAttributes extends BaseAttributes {
  ip: string;
  name: string;
  handlerPath?: string;
  description?: string;
  metadata?: Metadata;
  status?: DeviceStatus;
  sortOrder?: number;
  isActive?: boolean;
  lastSeen?: Date;
  port?: number;
  actions?: ActionAttributes[];
  icon?: string;
}

export class Device {
  id: string;
  ip: string;
  name: string;
  handlerPath?: string;
  description?: string;
  metadata: Metadata;
  status: DeviceStatus;
  sortOrder: number;
  isActive: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
  port?: number;
  icon?: string;
  __type: string;

  actions?: Action[];

  constructor(data: DeviceAttributes) {
    this.id = data.id || crypto.randomUUID();
    this.ip = data.ip;
    this.name = data.name.trim();
    this.handlerPath = data.handlerPath
      ? data.handlerPath.startsWith("/")
        ? data.handlerPath
        : `/${data.handlerPath}`
      : undefined;
    this.description = data.description;
    this.metadata = data.metadata || {};
    this.status = data.status || "offline";
    this.sortOrder = data.sortOrder || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastSeen = data.lastSeen;
    this.createdAt = data.createdAt || new Date();
    this.port = data.port;
    this.updatedAt = data.updatedAt || new Date();
    this.icon = data.icon;
    this.__type = "device";
  }

  updateLastSeen(): void {
    this.lastSeen = new Date();
    this.status = "online";
  }

  // Валидация
  validate(): string[] {
    const errors: string[] = [];

    if (!this.ip) errors.push("IP адрес обязателен");
    if (!this.name) errors.push("Название обязательно");
    if (this.name.length > 100)
      errors.push("Название должно быть до 100 символов");

    return errors;
  }

  get iconPath() {
    const networkStore = useNetworkStore();
    const result = networkStore.fileUrl + this.icon;
    return result
  }

  get selectOption() {
    return {
      value: this.id,
      label: this.name,
    };
  }

  // Статистика
  static getStats(devices: Device[]): {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
  } {
    const total = devices.length;
    const online = devices.filter((d) => d.status === "online").length;
    const maintenance = devices.filter(
      (d) => d.status === "maintenance",
    ).length;

    return {
      total,
      online,
      offline: total - online - maintenance,
      maintenance,
    };
  }

  // Скоупы
  static online(items: Device[]): Device[] {
    return items.filter((item) => item.status === "online");
  }

  static offline(items: Device[]): Device[] {
    return items.filter((item) => item.status === "offline");
  }

  static active(items: Device[]): Device[] {
    return items.filter((item) => item.isActive);
  }

  static ordered(items: Device[]): Device[] {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }

  static recentlyActive(items: Device[]): Device[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return items.filter((item) => item.lastSeen && item.lastSeen >= oneHourAgo);
  }

  static withActions(items: Device[]): Device[] {
    return items.filter((item) => item.actions && item.actions.length > 0);
  }
}
