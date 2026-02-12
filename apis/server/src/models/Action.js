// models/Action.js
const ActionValidator = require("../helpers/validators/actionValidator");

module.exports = (sequelize, DataTypes) => {
  const Action = sequelize.define(
    "Action",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      deviceId: {
        type: DataTypes.UUID,
        field: "device_id",
        allowNull: false,
        references: {
          model: "devices",
          key: "id",
        },
        validate: {
          notNull: { msg: "ID устройства обязателен" },
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: {
            args: [2, 100],
            msg: "Название должно быть от 2 до 100 символов",
          },
        },
      },
      path: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notNull: { msg: "Путь обязателен" },
        },
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: "Порт должен быть целым числом" },
          min: { args: [1], msg: "Порт должен быть от 1 до 65535" },
          max: { args: [65535], msg: "Порт должен быть от 1 до 65535" },
        },
      },
      method: {
        type: DataTypes.ENUM(
          "GET",
          "POST",
          "PUT",
          "DELETE",
          "PATCH",
          "OPTIONS",
        ),
        defaultValue: "GET",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        get() {
          const rawValue = this.getDataValue("metadata");
          return rawValue ? JSON.parse(rawValue) : {};
        },
        set(value) {
          this.setDataValue("metadata", JSON.stringify(value || {}));
        },
      },
      timeout: {
        type: DataTypes.INTEGER,
        defaultValue: 5000,
        validate: {
          min: { args: [100], msg: "Таймаут должен быть от 100 до 30000 мс" },
          max: { args: [30000], msg: "Таймаут должен быть от 100 до 30000 мс" },
        },
      },
      lastCall: {
        type: DataTypes.DATE,
        field: "last_call",
      },
      lastResponse: {
        type: DataTypes.INTEGER,
        field: "last_response",
      },
      lastError: {
        type: DataTypes.TEXT,
        field: "last_error",
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        field: "sort_order",
        defaultValue: 0,
        validate: {
          isInt: { msg: "Порядок сортировки должен быть целым числом" },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: true,
      },
      callCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "call_count",
      },
    },
    {
      tableName: "actions",
      timestamps: true,
      underscored: true,

      indexes: [
        {
          unique: true,
          fields: ["device_id", "name"],
          name: "unique_device_action",
        },
      ],

      hooks: {
        beforeValidate: async (action) => {
          if (action.name) {
            action.name = action.name.trim();
          }
          if (action.path && !action.path.startsWith("/")) {
            action.path = `/${action.path}`;
          }
        },

        afterCreate: async (action) => {
          console.log(
            `[ACTION CREATED] ${action.name} for device ${action.deviceId}`,
          );
        },
      },

      scopes: {
        withDevice: {
          include: [{ association: "device" }],
        },
        withParameters: {
          include: [{ association: "parameters" }],
        },
        withVoiceCommands: {
          include: [{ association: "voiceCommands" }],
        },
        active: {
          where: { is_active: true },
        },
        ordered: {
          order: [
            ["sort_order", "ASC"],
            ["name", "ASC"],
          ],
        },
        frequentlyCalled: {
          where: {
            callCount: {
              [sequelize.Sequelize.Op.gte]: 10,
            },
          },
        },
      },
    },
  );

  // Методы экземпляра
  Action.prototype.registerCall = async function (
    responseStatus,
    error = null,
  ) {
    this.lastCall = new Date();
    this.lastResponse = responseStatus;
    this.lastError = error;
    this.callCount = (this.callCount || 0) + 1;

    await this.save();

    // Обновляем lastSeen у устройства
    const device = await this.getDevice();
    if (device) {
      await device.updateLastSeen();
    }
  };

  return Action;
};
