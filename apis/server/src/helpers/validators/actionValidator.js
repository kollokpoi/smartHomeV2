class ActionValidator {
  static validate(data, isUpdate = false) {
    const errors = [];

    // ID устройства - только для создания
    if (!isUpdate && !data.deviceId) {
      errors.push({ field: 'deviceId', message: 'ID устройства обязателен' });
    }

    // Название
    if (!isUpdate && !data.name) {
      errors.push({ field: 'name', message: 'Название действия обязательно' });
    } else if (data.name !== undefined) {
      if (data.name.length < 2) {
        errors.push({ field: 'name', message: 'Название должно быть минимум 2 символа' });
      }
      if (data.name.length > 100) {
        errors.push({ field: 'name', message: 'Название должно быть максимум 100 символов' });
      }
    }

    // Путь
    if (!isUpdate && !data.path) {
      errors.push({ field: 'path', message: 'Путь обязателен' });
    } else if (data.path !== undefined) {
      const pathRegex = /^\/[a-zA-Z0-9\-._~!$&'()*+,;=:@/]*$/;
      if (!pathRegex.test(data.path)) {
        errors.push({ field: 'path', message: 'Путь должен начинаться с / и содержать только допустимые символы' });
      }
    }

    // Порт
    if (!isUpdate && !data.port && data.port !== 0) {
      errors.push({ field: 'port', message: 'Порт обязателен' });
    } else if (data.port !== undefined) {
      if (!Number.isInteger(data.port)) {
        errors.push({ field: 'port', message: 'Порт должен быть целым числом' });
      }
      if (data.port < 1 || data.port > 65535) {
        errors.push({ field: 'port', message: 'Порт должен быть от 1 до 65535' });
      }
    }

    // ВСЕ ОСТАЛЬНЫЕ ПОЛЯ - проверяем только если они переданы
    // HTTP метод
    if (data.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(data.method)) {
      errors.push({ field: 'method', message: 'Метод должен быть GET, POST, PUT, DELETE, PATCH или OPTIONS' });
    }

    // Таймаут
    if (data.timeout !== undefined) {
      if (!Number.isInteger(data.timeout)) {
        errors.push({ field: 'timeout', message: 'Таймаут должен быть целым числом' });
      }
      if (data.timeout < 100) {
        errors.push({ field: 'timeout', message: 'Таймаут должен быть минимум 100 мс' });
      }
      if (data.timeout > 30000) {
        errors.push({ field: 'timeout', message: 'Таймаут должен быть максимум 30000 мс' });
      }
    }

    // Описание
    if (data.description && data.description.length > 1000) {
      errors.push({ field: 'description', message: 'Описание должно быть максимум 1000 символов' });
    }

    // Порядок сортировки
    if (data.sortOrder !== undefined) {
      if (!Number.isInteger(data.sortOrder)) {
        errors.push({ field: 'sortOrder', message: 'Порядок сортировки должен быть целым числом' });
      }
      if (data.sortOrder < 0) {
        errors.push({ field: 'sortOrder', message: 'Порядок сортировки не может быть отрицательным' });
      }
    }

    return errors;
  }
}

module.exports = ActionValidator;