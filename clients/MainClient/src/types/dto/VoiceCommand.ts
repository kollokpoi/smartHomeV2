// types/VoiceCommand.ts
// types/VoiceCommand.ts
import type { Action, BaseAttributes } from '.';
import type { ActionAttributes } from '.';

export interface VoiceCommandAttributes extends BaseAttributes {
  actionId: string;
  command: string;
  language?: string;
  priority?: number;
  isActive?: boolean;
  usageCount?: number;
  lastUsed?: Date | null;
  sortOrder?: number;
  
  // Relations
  action?: ActionAttributes;
}

export class VoiceCommand {
  id: string;
  actionId: string;
  command: string;
  language: string;
  priority: number;
  isActive: boolean;
  usageCount: number;
  lastUsed: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  action?: Action;

  constructor(data: VoiceCommandAttributes) {
    this.id = data.id || crypto.randomUUID();
    this.actionId = data.actionId;
    this.command = data.command.toLowerCase().trim();
    this.language = data.language || 'ru-RU';
    this.priority = data.priority || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.usageCount = data.usageCount || 0;
    this.lastUsed = data.lastUsed || null;
    this.sortOrder = data.sortOrder || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Методы экземпляра
  registerUse(): void {
    this.usageCount += 1;
    this.lastUsed = new Date();
  }

  // Валидация
  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.actionId) errors.push('ID действия обязательно');
    if (!this.command) errors.push('Команда обязательна');
    
    return errors;
  }

  // Поиск по команде
  static findByCommand(items: VoiceCommand[], command: string, language: string = 'ru-RU'): VoiceCommand | undefined {
    return items.find(item => 
      item.command === command.toLowerCase().trim() && 
      item.language === language && 
      item.isActive
    );
  }

  // Скоупы
  static active(items: VoiceCommand[]): VoiceCommand[] {
    return items.filter(item => item.isActive);
  }

  static byLanguage(items: VoiceCommand[], lang: string): VoiceCommand[] {
    return items.filter(item => item.language === lang);
  }

  static highPriority(items: VoiceCommand[]): VoiceCommand[] {
    return items.filter(item => item.priority >= 50);
  }

  static mostUsed(items: VoiceCommand[]): VoiceCommand[] {
    return [...items].sort((a, b) => b.usageCount - a.usageCount);
  }

  static ordered(items: VoiceCommand[]): VoiceCommand[] {
    return [...items].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.command.localeCompare(b.command);
    });
  }
}