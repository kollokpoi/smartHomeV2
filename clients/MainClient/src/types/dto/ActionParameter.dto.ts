// types/ActionParameter.ts
import type { BaseAttributes } from '.';
import type { ActionAttributes } from '.';
import type { Action } from './Action.dto';

export type ParameterLocation = 'body' | 'query' | 'path' | 'headers';
export type ParameterType = 'string' | 'number' | 'boolean' | 'json' | 'array';
export type ContentType = 'json' | 'formdata' | 'x-www-form-urlencoded' | 'plain';

export interface ActionParameterAttributes extends BaseAttributes {
  actionId: string;
  location: ParameterLocation;
  key: string;
  value?: string | null;
  type?: ParameterType;
  required?: boolean;
  contentType?: ContentType;
  sortOrder?: number;
  isActive?: boolean;
  
  action?: ActionAttributes;
}

export class ActionParameter {
  id: string;
  actionId: string;
  location: ParameterLocation;
  key: string;
  value: string | null;
  type: ParameterType;
  required: boolean;
  contentType: ContentType;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  action?: Action;

  constructor(data: ActionParameterAttributes) {
    this.id = data.id || crypto.randomUUID();
    this.actionId = data.actionId;
    this.location = data.location;
    this.key = data.key.trim();
    this.value = data.value || null;
    this.type = data.type || 'string';
    this.required = data.required || false;
    this.contentType = data.contentType || 'json';
    this.sortOrder = data.sortOrder || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  getTypedValue(): any {
    if (this.value === null || this.value === undefined) return null;

    switch (this.type) {
      case 'number':
        return Number(this.value);
      case 'boolean':
        return this.value === 'true';
      case 'json':
        try {
          return typeof this.value === 'string' ? JSON.parse(this.value) : this.value;
        } catch {
          return this.value;
        }
      case 'array':
        try {
          if (typeof this.value === 'string' && this.value.startsWith('[')) {
            return JSON.parse(this.value);
          }
        } catch {}
        return Array.isArray(this.value) ? this.value : [this.value];
      default:
        return this.value;
    }
  }

  // Валидация
  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.actionId) errors.push('ID действия обязательно');
    if (!this.key) errors.push('Ключ параметра обязателен');
    if (!/^[a-zA-Z_][a-zA-Z0-9_\-]*$/.test(this.key)) {
      errors.push('Ключ может содержать только буквы, цифры, дефис и подчеркивание');
    }
    
    if (this.type === 'json' && this.value) {
      try {
        if (typeof this.value === 'string') {
          JSON.parse(this.value);
        }
      } catch {
        errors.push('Некорректный JSON в значении параметра');
      }
    }
    
    return errors;
  }

  // Скоупы
  static bodyParams(items: ActionParameter[]): ActionParameter[] {
    return items.filter(item => item.location === 'body');
  }

  static queryParams(items: ActionParameter[]): ActionParameter[] {
    return items.filter(item => item.location === 'query');
  }

  static pathParams(items: ActionParameter[]): ActionParameter[] {
    return items.filter(item => item.location === 'path');
  }

  static required(items: ActionParameter[]): ActionParameter[] {
    return items.filter(item => item.required);
  }

  static active(items: ActionParameter[]): ActionParameter[] {
    return items.filter(item => item.isActive);
  }

  static ordered(items: ActionParameter[]): ActionParameter[] {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.key.localeCompare(b.key);
    });
  }
}