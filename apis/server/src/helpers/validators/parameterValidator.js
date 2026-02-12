// helpers/validators/parameterValidator.js
class ParameterValidator {
  static validate(data, isUpdate = false) {
    const errors = [];

    // ID действия - только для создания
    if (!isUpdate && !data.actionId) {
      errors.push({ field: 'actionId', message: 'ID действия обязателен' });
    }

    // Местоположение - только для создания
    if (!isUpdate && !data.location) {
      errors.push({ field: 'location', message: 'Местоположение параметра обязательно' });
    } else if (data.location !== undefined) {
      const validLocations = ['body', 'query', 'path', 'headers'];
      if (!validLocations.includes(data.location)) {
        errors.push({ field: 'location', message: 'Местоположение должно быть body, query, path или headers' });
      }
    }

    // Ключ - только для создания
    if (!isUpdate && !data.key) {
      errors.push({ field: 'key', message: 'Ключ параметра обязателен' });
    } else if (data.key !== undefined) {
      const keyRegex = /^[a-zA-Z_][a-zA-Z0-9_\-]*$/;
      if (!keyRegex.test(data.key)) {
        errors.push({ field: 'key', message: 'Ключ может содержать только буквы, цифры, дефис и подчеркивание' });
      }
      if (data.key.length > 100) {
        errors.push({ field: 'key', message: 'Ключ должен быть максимум 100 символов' });
      }
    }

    // Тип данных
    if (data.type !== undefined) {
      const validTypes = ['string', 'number', 'boolean', 'json', 'array'];
      if (!validTypes.includes(data.type)) {
        errors.push({ field: 'type', message: 'Тип должен быть string, number, boolean, json или array' });
      }
    }

    // Content-Type (только для body)
    if (data.contentType !== undefined) {
      const validContentTypes = ['json', 'formdata', 'x-www-form-urlencoded', 'plain'];
      if (!validContentTypes.includes(data.contentType)) {
        errors.push({ field: 'contentType', message: 'Content-Type должен быть json, formdata, x-www-form-urlencoded или plain' });
      }
      if (data.location && data.location !== 'body') {
        errors.push({ field: 'contentType', message: 'Content-Type можно указывать только для body параметров' });
      }
    }

    // Обязательность
    if (data.required !== undefined && typeof data.required !== 'boolean') {
      errors.push({ field: 'required', message: 'Поле required должно быть true или false' });
    }

    // Значение
    if (data.value !== undefined && data.value !== null) {
      const type = data.type || 'string';
      
      if (type === 'number') {
        if (isNaN(Number(data.value))) {
          errors.push({ field: 'value', message: 'Значение должно быть числом' });
        }
      }
      
      if (type === 'boolean') {
        if (data.value !== true && data.value !== false && data.value !== 'true' && data.value !== 'false') {
          errors.push({ field: 'value', message: 'Значение должно быть true или false' });
        }
      }
      
      if (type === 'json') {
        try {
          if (typeof data.value === 'string') {
            JSON.parse(data.value);
          }
        } catch {
          errors.push({ field: 'value', message: 'Значение должно быть валидным JSON' });
        }
      }
      
      if (type === 'array') {
        if (typeof data.value === 'string' && data.value.startsWith('[')) {
          try {
            JSON.parse(data.value);
          } catch {
            errors.push({ field: 'value', message: 'Значение должно быть валидным массивом' });
          }
        } else if (!Array.isArray(data.value)) {
          errors.push({ field: 'value', message: 'Значение должно быть массивом' });
        }
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

module.exports = ParameterValidator;