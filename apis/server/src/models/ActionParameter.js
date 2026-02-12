// models/ActionParameter.js
const ParameterValidator = require("../helpers/validators/parameterValidator");

module.exports = (sequelize, DataTypes) => {
  const ActionParameter = sequelize.define(
    "ActionParameter",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      actionId: {
        type: DataTypes.UUID,
        field: "action_id",
        allowNull: false,
        references: {
          model: "actions",
          key: "id",
        },
      },
      location: {
        type: DataTypes.ENUM("body", "query", "path", "headers"),
        allowNull: false,
        validate: {
          isIn: {
            args: [["body", "query", "path", "headers"]],
            msg: "Некорректное местоположение параметра",
          },
        },
      },
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notNull: { msg: "Ключ параметра обязателен" },
          is: {
            args: /^[a-zA-Z_][a-zA-Z0-9_\-]*$/,
            msg: "Ключ может содержать только буквы, цифры, дефис и подчеркивание",
          },
        },
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("string", "number", "boolean", "json", "array"),
        defaultValue: "string",
      },
      required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      contentType: {
        type: DataTypes.ENUM(
          "json",
          "formdata",
          "x-www-form-urlencoded",
          "plain",
        ),
        field: "content_type",
        defaultValue: "json",
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
    },
    {
      tableName: "action_parameters",
      timestamps: true,
      underscored: true,

      indexes: [
        {
          unique: true,
          fields: ["action_id", "location", "key"],
          name: "unique_action_parameter",
        },
      ],

      hooks: {
        beforeValidate: async (param) => {
          if (param.key) {
            param.key = param.key.trim();
          }
          if (
            param.value &&
            param.type === "json" &&
            typeof param.value === "string"
          ) {
            try {
              JSON.parse(param.value);
            } catch {
              throw new Error("Некорректный JSON в значении параметра");
            }
          }
        },

        afterCreate: async (param) => {
          console.log(
            `[PARAMETER CREATED] ${param.key} for action ${param.actionId}`,
          );
        },
      },

      scopes: {
        bodyParams: {
          where: { location: "body" },
        },
        queryParams: {
          where: { location: "query" },
        },
        pathParams: {
          where: { location: "path" },
        },
        required: {
          where: { required: true },
        },
        active: {
          where: { is_active: true },
        },
        ordered: {
          order: [
            ["sort_order", "ASC"],
            ["key", "ASC"],
          ],
        },
      },
    },
  );

  // Методы экземпляра
  ActionParameter.prototype.getTypedValue = function () {
    if (this.value === null || this.value === undefined) return null;

    switch (this.type) {
      case "number":
        return Number(this.value);
      case "boolean":
        return this.value === "true" || this.value === true;
      case "json":
        return typeof this.value === "string"
          ? JSON.parse(this.value)
          : this.value;
      case "array":
        if (typeof this.value === "string" && this.value.startsWith("[")) {
          return JSON.parse(this.value);
        }
        return Array.isArray(this.value) ? this.value : [this.value];
      default:
        return this.value;
    }
  };

  return ActionParameter;
};
