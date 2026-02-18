// types/Action.ts
// types/Action.ts
import type { ActionParameter, BaseAttributes, Device, Metadata, VoiceCommand } from '.';
import type { DeviceAttributes } from '.';
import type { ActionParameterAttributes } from '.';
import type { VoiceCommandAttributes } from '.';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export interface ActionAttributes extends BaseAttributes {
  deviceId: string;
  name: string;
  path: string;
  port: number;
  method?: HttpMethod;
  description?: string | null;
  metadata?: Metadata;
  timeout?: number;
  lastCall?: Date | null;
  lastResponse?: number | null;
  lastError?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  callCount?: number;
  
  // Relations (опционально, для загрузки связанных данных)
  device?: DeviceAttributes;
  parameters?: ActionParameterAttributes[];
  voiceCommands?: VoiceCommandAttributes[];
}

export class Action {
  id: string;
  deviceId: string;
  name: string;
  path: string;
  port: number;
  method: HttpMethod;
  description: string | null;
  metadata: Record<string, any>;
  timeout: number;
  lastCall: Date | null;
  lastResponse: number | null;
  lastError: string | null;
  sortOrder: number;
  isActive: boolean;
  callCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  device?: Device;
  parameters?: ActionParameter[];
  voiceCommands?: VoiceCommand[];

  constructor(data: ActionAttributes) {
    this.id = data.id || crypto.randomUUID();
    this.deviceId = data.deviceId;
    this.name = data.name.trim();
    this.path = data.path.startsWith('/') ? data.path : `/${data.path}`;
    this.port = data.port;
    this.method = data.method || 'GET';
    this.description = data.description || null;
    this.metadata = data.metadata || {};
    this.timeout = data.timeout || 5000;
    this.lastCall = data.lastCall || null;
    this.lastResponse = data.lastResponse || null;
    this.lastError = data.lastError || null;
    this.sortOrder = data.sortOrder || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.callCount = data.callCount || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Методы экземпляра
  registerCall(responseStatus: number | null, error: string | null = null): void {
    this.lastCall = new Date();
    this.lastResponse = responseStatus;
    this.lastError = error;
    this.callCount += 1;
  }

  // Валидация
  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.deviceId) errors.push('ID устройства обязателен');
    if (this.name.length < 2 || this.name.length > 100) {
      errors.push('Название должно быть от 2 до 100 символов');
    }
    if (!this.path) errors.push('Путь обязателен');
    if (this.port < 1 || this.port > 65535) {
      errors.push('Порт должен быть от 1 до 65535');
    }
    if (this.timeout < 100 || this.timeout > 30000) {
      errors.push('Таймаут должен быть от 100 до 30000 мс');
    }
    
    return errors;
  }

  // Скоупы (статичные методы для фильтрации)
  static active(items: Action[]): Action[] {
    return items.filter(item => item.isActive);
  }

  static ordered(items: Action[]): Action[] {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }

  static frequentlyCalled(items: Action[]): Action[] {
    return items.filter(item => item.callCount >= 10);
  }

  static withDevice(items: Action[]): Action[] {
    return items.filter(item => item.device);
  }
}