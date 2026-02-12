// helpers/validators/deviceValidator.js
class DeviceValidator {
  static validate(data) {
    const errors = [];

    // IP
    if (!data.ip) {
      errors.push({ field: 'ip', message: 'IP адрес обязателен' });
    } else {
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipv4Regex.test(data.ip)) {
        errors.push({ field: 'ip', message: 'Некорректный IP адрес' });
      }
    }

    // Название
    if (!data.name) {
      errors.push({ field: 'name', message: 'Название обязательно' });
    } else {
      if (data.name.length < 3) {
        errors.push({ field: 'name', message: 'Название должно быть минимум 3 символа' });
      }
      if (data.name.length > 100) {
        errors.push({ field: 'name', message: 'Название должно быть максимум 100 символов' });
      }
    }

    // Путь обработчика (необязательный)
    if (data.handlerPath) {
      const pathRegex = /^\/[a-zA-Z0-9\-._~!$&'()*+,;=:@/]*$/;
      if (!pathRegex.test(data.handlerPath)) {
        errors.push({ field: 'handlerPath', message: 'Путь должен начинаться с / и содержать только допустимые символы' });
      }
    }

    // Описание (необязательное)
    if (data.description && data.description.length > 1000) {
      errors.push({ field: 'description', message: 'Описание должно быть максимум 1000 символов' });
    }

    // Метаданные (необязательные)
    if (data.metadata) {
      if (typeof data.metadata !== 'object') {
        errors.push({ field: 'metadata', message: 'Метаданные должны быть объектом' });
      }
    }

    if (data.status && !['online', 'offline', 'maintenance'].includes(data.status)) {
      errors.push({ field: 'status', message: 'Статус должен быть online, offline или maintenance' });
    }

    // Порядок сортировки (необязательный)
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

module.exports = DeviceValidator;