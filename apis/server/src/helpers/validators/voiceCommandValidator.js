class VoiceCommandValidator {
  static validate(data) {
    const errors = [];

    if (!data.actionId) {
      errors.push({ field: "actionId", message: "ID действия обязателен" });
    }

    if (!data.command) {
      errors.push({ field: "command", message: "Текст команды обязателен" });
    } else {
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

    if (data.language && !VoiceCommandValidator.isValidLanguage(data.language)) {
      errors.push({ field: 'language', message: 'Язык должен быть ru-RU, en-US, uk-UA, tr-TR или kk-KZ' });
    }
    
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

    // Параметры (deprecated, но проверяем формат)
    if (data.parameters !== undefined) {
      if (
        typeof data.parameters !== "object" ||
        Array.isArray(data.parameters)
      ) {
        errors.push({
          field: "parameters",
          message: "Параметры должны быть объектом",
        });
      }
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

    if (
      data.language &&
      !VoiceCommandValidator.isValidLanguage(data.language)
    ) {
      errors.push({ field: "language", message: "Неподдерживаемый язык" });
    }

    return errors;
  }
}

module.exports = VoiceCommandValidator;
