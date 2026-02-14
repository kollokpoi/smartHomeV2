// helpers/validators/deviceValidator.js
class DeviceValidator {
  static validate(data, isUpdate = false) {
    const errors = [];

    // IP - только для создания
    if (!isUpdate && !data.ip) {
      errors.push({ field: 'ip', message: 'IP адрес обязателен' });
    } else if (data.ip !== undefined) {
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipv4Regex.test(data.ip)) {
        errors.push({ field: 'ip', message: 'Некорректный IP адрес' });
      }
    }

    // Название - только для создания
    if (!isUpdate && !data.name) {
      errors.push({ field: 'name', message: 'Название обязательно' });
    } else if (data.name !== undefined) {
      if (data.name.length < 3) {
        errors.push({ field: 'name', message: 'Название должно быть минимум 3 символа' });
      }
      if (data.name.length > 100) {
        errors.push({ field: 'name', message: 'Название должно быть максимум 100 символов' });
      }
    }

    // Путь обработчика
    if (data.handlerPath !== undefined) {
      if (data.handlerPath === null || data.handlerPath === '') {
        errors.push({ field: 'handlerPath', message: 'Путь не может быть пустым' });
      } else {
        const pathRegex = /^\/[a-zA-Z0-9\-._~!$&'()*+,;=:@/]*$/;
        if (!pathRegex.test(data.handlerPath)) {
          errors.push({ field: 'handlerPath', message: 'Путь должен начинаться с / и содержать только допустимые символы' });
        }
      }
    }

    // Описание
    if (data.description !== undefined && data.description !== null) {
      if (data.description.length > 1000) {
        errors.push({ field: 'description', message: 'Описание должно быть максимум 1000 символов' });
      }
    }

    // Метаданные
    if (data.metadata !== undefined) {
      if (data.metadata === null) {
        errors.push({ field: 'metadata', message: 'Метаданные не могут быть null' });
      } else if (typeof data.metadata !== 'object') {
        errors.push({ field: 'metadata', message: 'Метаданные должны быть объектом' });
      }
    }

    // Статус
    if (data.status !== undefined) {
      if (!['online', 'offline', 'maintenance'].includes(data.status)) {
        errors.push({ field: 'status', message: 'Статус должен быть online, offline или maintenance' });
      }
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

    // Активность
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      errors.push({ field: 'isActive', message: 'Поле isActive должно быть true или false' });
    }

    return errors;
  }
}

module.exports = DeviceValidator;