// types/Device.ts
// types/Device.ts
import type { Action, BaseAttributes, Metadata } from '.';
import type { ActionAttributes } from '.';

export type DeviceStatus = 'online' | 'offline' | 'maintenance';

export interface DeviceAttributes extends BaseAttributes {
  ip: string;
  name: string;
  handlerPath?: string | null;
  description?: string | null;
  metadata?: Record<string, any>;
  status?: DeviceStatus;
  sortOrder?: number;
  isActive?: boolean;
  lastSeen?: Date | null;
  
  // Relations
  actions?: ActionAttributes[];
}

export class Device {
  id: string;
  ip: string;
  name: string;
  handlerPath: string | null;
  description: string | null;
  metadata: Metadata;
  status: DeviceStatus;
  sortOrder: number;
  isActive: boolean;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  actions?: Action[];

  constructor(data: DeviceAttributes) {
    this.id = data.id || crypto.randomUUID();
    this.ip = data.ip;
    this.name = data.name.trim();
    this.handlerPath = data.handlerPath 
      ? (data.handlerPath.startsWith('/') ? data.handlerPath : `/${data.handlerPath}`)
      : null;
    this.description = data.description || null;
    this.metadata = data.metadata || {};
    this.status = data.status || 'offline';
    this.sortOrder = data.sortOrder || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastSeen = data.lastSeen || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Методы экземпляра
  updateLastSeen(): void {
    this.lastSeen = new Date();
    this.status = 'online';
  }

  // Валидация
  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.ip) errors.push('IP адрес обязателен');
    if (!this.name) errors.push('Название обязательно');
    if (this.name.length > 100) errors.push('Название должно быть до 100 символов');
    
    return errors;
  }

  // Статистика
  static getStats(devices: Device[]): {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
  } {
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;
    const maintenance = devices.filter(d => d.status === 'maintenance').length;
    
    return {
      total,
      online,
      offline: total - online - maintenance,
      maintenance
    };
  }

  // Скоупы
  static online(items: Device[]): Device[] {
    return items.filter(item => item.status === 'online');
  }

  static offline(items: Device[]): Device[] {
    return items.filter(item => item.status === 'offline');
  }

  static active(items: Device[]): Device[] {
    return items.filter(item => item.isActive);
  }

  static ordered(items: Device[]): Device[] {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }

  static recentlyActive(items: Device[]): Device[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return items.filter(item => item.lastSeen && item.lastSeen >= oneHourAgo);
  }

  static withActions(items: Device[]): Device[] {
    return items.filter(item => item.actions && item.actions.length > 0);
  }
}