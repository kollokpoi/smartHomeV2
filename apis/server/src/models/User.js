const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const AdminUser = sequelize.define('Users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      },
      comment: 'Email администратора'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255]
      },
      comment: 'Хэшированный пароль'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Имя администратора'
    },
    role: {
      type: DataTypes.ENUM('root', 'admin', 'moderator', 'user', 'bot'),
      defaultValue: 'admin',
      comment: 'Роль пользователя'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Активен ли пользователь'
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата последнего входа'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      field: "sort_order",
      defaultValue: 0,
      validate: {
        isInt: { msg: "Порядок сортировки должен быть целым числом" },
      },
    },
  }, {
    tableName: 'users',
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      },
      active: {
        where: { is_active: true }
      }
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // Методы экземпляра
  AdminUser.prototype.validPassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  AdminUser.prototype.updateLastLogin = async function () {
    return await this.update({ last_login: new Date() });
  };

  AdminUser.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return AdminUser;
};