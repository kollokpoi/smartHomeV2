import {
  ActionParameter,
  Device,
  VoiceCommand,
  type BaseAttributes,
  type Metadata,
} from ".";
import type { DeviceAttributes } from ".";
import type { ActionParameterAttributes } from ".";
import type { VoiceCommandAttributes } from ".";
import type { HttpMethod } from "../constants";

export interface ActionAttributes extends BaseAttributes {
  deviceId: string;
  name: string;
  path: string;
  port: number;
  method?: HttpMethod;
  description?: string;
  metadata?: Metadata;
  timeout?: number;
  lastCall?: Date;
  lastResponse?: number;
  lastError?: string;
  sortOrder?: number;
  isActive?: boolean;
  callCount?: number;

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
  description?: string;
  metadata: Record<string, any>;
  timeout: number;
  lastCall?: Date;
  lastResponse?: number;
  lastError?: string;
  sortOrder: number;
  isActive: boolean;
  callCount: number;
  createdAt: Date;
  updatedAt: Date;

  device?: Device;
  parameters?: ActionParameter[];
  voiceCommands?: VoiceCommand[];

  constructor(data: ActionAttributes) {
    this.id = data.id || crypto.randomUUID();
    this.deviceId = data.deviceId;
    this.name = data.name.trim();
    this.path = data.path.startsWith("/") ? data.path : `/${data.path}`;
    this.port = data.port;
    this.method = data.method || "GET";
    this.description = data.description;
    this.metadata = data.metadata || {};
    this.timeout = data.timeout || 5000;
    this.lastCall = data.lastCall;
    this.lastResponse = data.lastResponse;
    this.lastError = data.lastError;
    this.sortOrder = data.sortOrder || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.callCount = data.callCount || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();

    if (data.device) this.device = new Device(data.device);
    if (data.parameters)
      this.parameters = data.parameters.map((x) => new ActionParameter(x));
    if (data.voiceCommands)
      this.voiceCommands = data.voiceCommands.map((x) => new VoiceCommand(x));
  }

  registerCall(
    responseStatus: number | undefined,
    error: string | undefined,
  ): void {
    this.lastCall = new Date();
    this.lastResponse = responseStatus;
    this.lastError = error;
    this.callCount += 1;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.deviceId) errors.push("ID устройства обязателен");
    if (this.name.length < 2 || this.name.length > 100) {
      errors.push("Название должно быть от 2 до 100 символов");
    }
    if (!this.path) errors.push("Путь обязателен");
    if (this.port < 1 || this.port > 65535) {
      errors.push("Порт должен быть от 1 до 65535");
    }
    if (this.timeout < 100 || this.timeout > 30000) {
      errors.push("Таймаут должен быть от 100 до 30000 мс");
    }

    return errors;
  }

  get selectOption() {
    return {
      value: this.id,
      label: this.name,
    };
  }

  static active(items: Action[]): Action[] {
    return items.filter((item) => item.isActive);
  }

  static ordered(items: Action[]): Action[] {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }

  static frequentlyCalled(items: Action[]): Action[] {
    return items.filter((item) => item.callCount >= 10);
  }

  static withDevice(items: Action[]): Action[] {
    return items.filter((item) => item.device);
  }
}
