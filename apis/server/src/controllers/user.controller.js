// controllers/userController.js
const PaginationHelper = require('../helpers/paginationHelper');
const { User } = require('../models');
const { Op } = require('sequelize');

class UserController {
    async list(req, res, next) {
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

            if (isActive !== undefined) {
                where.is_active = isActive === 'true';
            }

            if (role) {
                where.role = role;
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
                const searchFields = ['name', 'email'];
                where[Op.or] = PaginationHelper.createSearchCondition(search, searchFields, Op);
            }

            const allowedSortFields = [
                "name",
                "email",
                "createdAt",
                "updatedAt",
                "role",
                "last_login",
                "sortOrder"
            ];
            const order = PaginationHelper.getSortingParams(
                sortBy,
                sortOrder,
                allowedSortFields
            );

            const { count, rows } = await User.findAndCountAll({
                where,
                order,
                limit,
                offset,
                distinct: true,
                attributes: { exclude: ['password'] }
            });

            res.json({
                success: true,
                data: rows,
                pagination: PaginationHelper.getPaginationResponse(count, page, limit)
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id, {
                attributes: { exclude: ['password'] }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь не найден'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        const transaction = await User.sequelize.transaction();

        try {
            const { email, password, name, role, is_active, sortOrder } = req.body;

            // Проверка на существующего пользователя
            const existingUser = await User.findOne({
                where: { email },
                transaction
            });

            if (existingUser) {
                await transaction.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Пользователь с таким email уже существует',
                    errors: [{ field: 'email', message: 'Email уже используется' }]
                });
            }

            const user = await User.create({
                email,
                password,
                name,
                role: role || 'user',
                is_active: is_active !== undefined ? is_active : true,
                sortOrder: sortOrder || 0
            }, { transaction });

            await transaction.commit();

            res.status(201).json({
                success: true,
                data: user.toJSON()
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    }

    async update(req, res, next) {
        const transaction = await User.sequelize.transaction();

        try {
            const { id } = req.params;
            const { email, password, name, role, is_active, sortOrder } = req.body;

            const user = await User.findByPk(id, { transaction });

            if (!user) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь не найден'
                });
            }

            // Если меняется email - проверяем уникальность
            if (email && email !== user.email) {
                const existingUser = await User.findOne({
                    where: { email },
                    transaction
                });

                if (existingUser) {
                    await transaction.rollback();
                    return res.status(409).json({
                        success: false,
                        message: 'Пользователь с таким email уже существует',
                        errors: [{ field: 'email', message: 'Email уже используется' }]
                    });
                }
                user.email = email;
            }

            if (password) {
                user.password = password;
            }
            if (name !== undefined) user.name = name;
            if (role !== undefined) user.role = role;
            if (is_active !== undefined) user.is_active = is_active;
            if (sortOrder !== undefined) user.sortOrder = sortOrder;

            await user.save({ transaction });
            await transaction.commit();

            res.json({
                success: true,
                data: user.toJSON()
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    }

    async delete(req, res, next) {
        const transaction = await User.sequelize.transaction();

        try {
            const { id } = req.params;

            const user = await User.findByPk(id, { transaction });

            if (!user) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь не найден'
                });
            }

            // Не даём удалить root пользователя
            if (user.role === 'root') {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Нельзя удалить root пользователя'
                });
            }

            await user.destroy({ transaction });
            await transaction.commit();

            res.json({
                success: true,
                message: 'Пользователь удалён'
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    }
}

module.exports = new UserController();