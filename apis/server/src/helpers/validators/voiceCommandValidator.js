class VoiceCommandValidator {
  static validate(data, isUpdate = false) {
    const errors = [];

    // ID действия - только для создания
    if (!isUpdate && !data.actionId) {
      errors.push({ field: "actionId", message: "ID действия обязателен" });
    }

    // Команда
    if (!isUpdate && !data.command) {
      errors.push({ field: "command", message: "Текст команды обязателен" });
    } else if (data.command !== undefined) {
      if (data.command.length < 2) {
        errors.push({
          field: "command",
          message: "Команда должна быть минимум 2 символа",
        });
      }
      if (data.command.length > 500) {
        errors.push({
          field: "command",
          message: "Команда должна быть максимум 500 символов",
        });
      }
    }

    // Язык
    if (data.language !== undefined) {
      if (!VoiceCommandValidator.isValidLanguage(data.language)) {
        errors.push({ field: 'language', message: 'Язык должен быть ru-RU, en-US, uk-UA, tr-TR или kk-KZ' });
      }
    }
    
    // Приоритет
    if (data.priority !== undefined) {
      if (!Number.isInteger(data.priority)) {
        errors.push({
          field: "priority",
          message: "Приоритет должен быть целым числом",
        });
      }
      if (data.priority < 0) {
        errors.push({
          field: "priority",
          message: "Приоритет не может быть отрицательным",
        });
      }
      if (data.priority > 100) {
        errors.push({
          field: "priority",
          message: "Приоритет должен быть максимум 100",
        });
      }
    }

    // Активность
    if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
      errors.push({
        field: "isActive",
        message: "Поле isActive должно быть true или false",
      });
    }

    // Порядок сортировки
    if (data.sortOrder !== undefined) {
      if (!Number.isInteger(data.sortOrder)) {
        errors.push({
          field: "sortOrder",
          message: "Порядок сортировки должен быть целым числом",
        });
      }
      if (data.sortOrder < 0) {
        errors.push({
          field: "sortOrder",
          message: "Порядок сортировки не может быть отрицательным",
        });
      }
    }

    // Параметры - УБИРАЕМ НАХУЙ! они deprecated
    if (data.parameters !== undefined) {
      errors.push({
        field: "parameters",
        message: "Параметры больше не поддерживаются, используйте ActionParameter",
      });
    }

    return errors;
  }

  static isValidLanguage(lang) {
    const validLanguages = ["ru-RU", "en-US", "uk-UA", "tr-TR", "kk-KZ"];
    return validLanguages.includes(lang);
  }

  static validateProcess(data) {
    const errors = [];

    if (!data.command) {
      errors.push({ field: "command", message: "Команда не передана" });
    } else if (typeof data.command !== "string") {
      errors.push({ field: "command", message: "Команда должна быть строкой" });
    }

    if (data.language && !VoiceCommandValidator.isValidLanguage(data.language)) {
      errors.push({ field: "language", message: "Неподдерживаемый язык" });
    }

    return errors;
  }
}

module.exports = VoiceCommandValidator;