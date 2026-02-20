const PaginationHelper = require('../helpers/paginationHelper');
const { User } = require('../models')
const { Op } = require('sequelize');

class UserController {
    async List(req, res, next) {
        try {
            const { page, limit, offset, sortBy, sortOrder, filters } =
                PaginationHelper.getPaginationParams(req.query);
            const {
                search,
                isActive,
                role,
                lastLoginFrom,
                lastLoginTo
            } = filters;

            const where = {};

            if (isActive) {
                where.is_active = isActive === 'true';
            }

            if (role) {
                where.role = role
            }

            if (lastLoginFrom || lastLoginTo) {
                where.last_login = {};
                if (lastLoginFrom) {
                    where.last_login[Op.gte] = new Date(lastLoginFrom);
                }
                if (lastLoginTo) {
                    where.last_login[Op.lte] = new Date(lastLoginTo);
                }
            }

            if (search) {
                const searchFields = [
                    'name', 'email'
                ]
                where[Op.or] = PaginationHelper.createSearchCondition(search, searchFields, Op);
            }

            const allowedSortFields = [
                "name",
                "email",
                "createdAt",
                "updatedAt",
                "role",
                "last_login",
            ];
            const order = PaginationHelper.getSortingParams(
                sortBy,
                sortOrder,
                allowedSortFields,
            );
            
        } catch (error) {
            next(error)
        }
    }

    async getById(req, res, next) {

    }

    async create(req, res, next) {

    }

    async update(req, res, next) {

    }

    async delete(req, res, next) {

    }
}

module.exports = new UserController();