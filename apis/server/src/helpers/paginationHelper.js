// helpers/paginationHelper.js
class PaginationHelper {
  /**
   * Формирует объект пагинации из query параметров
   */
  static getPaginationParams(query) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'sortOrder',
      sortOrder = 'ASC',
      ...filters
    } = query;

    return {
      page: parseInt(page),
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      sortBy,
      sortOrder: sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      filters
    };
  }

  /**
   * Формирует ответ с пагинацией
   */
  static getPaginationResponse(count, page, limit) {
    const totalPages = Math.ceil(count / limit);
    
    return {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1
    };
  }

  /**
   * Создает where условие для поиска по тексту
   */
  static createSearchCondition(search, fields, sequelize) {
    if (!search) return {};
    
    return {
      [sequelize.Op.or]: fields.map(field => ({
        [field]: { [sequelize.Op.like]: `%${search}%` }
      }))
    };
  }

  /**
   * Фильтрует разрешенные поля для сортировки
   */
  static getSortingParams(sortBy, sortOrder, allowedFields) {
    if (!allowedFields.includes(sortBy)) {
      sortBy = allowedFields[0];
    }
    return [[sortBy, sortOrder]];
  }
}

module.exports = PaginationHelper;