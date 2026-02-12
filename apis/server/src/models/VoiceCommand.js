// models/VoiceCommand.js
const VoiceCommandValidator = require("../helpers/validators/voiceCommandValidator");

module.exports = (sequelize, DataTypes) => {
  const VoiceCommand = sequelize.define(
    "VoiceCommand",
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
      command: {
        type: DataTypes.STRING(100), 
        allowNull: false,
        validate: {
          notNull: { msg: "Текст команды обязателен" },
          len: {
            args: [2, 500],
            msg: "Команда должна быть от 2 до 500 символов",
          },
        },
        set(value) {
          this.setDataValue("command", value.toLowerCase().trim());
        },
      },
      language: {
        type: DataTypes.STRING(10),
        defaultValue: "ru-RU",
        validate: {
          isValidLanguage(value) {
            if (!VoiceCommandValidator.isValidLanguage(value)) {
              throw new Error("Неподдерживаемый язык");
            }
          },
        },
      },
      parameters: {
        type: DataTypes.JSON,
        defaultValue: {},
        get() {
          const rawValue = this.getDataValue("parameters");
          return rawValue ? JSON.parse(rawValue) : {};
        },
        set(value) {
          this.setDataValue("parameters", JSON.stringify(value || {}));
        },
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: [0], msg: "Приоритет должен быть от 0 до 100" },
          max: { args: [100], msg: "Приоритет должен быть от 0 до 100" },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: true,
      },
      usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "usage_count",
      },
      lastUsed: {
        type: DataTypes.DATE,
        field: "last_used",
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        field: "sort_order",
        defaultValue: 0,
        validate: {
          isInt: { msg: "Порядок сортировки должен быть целым числом" },
        },
      },
    },
    {
      tableName: "voice_commands",
      timestamps: true,
      underscored: true,

      // 👉 ИНДЕКСЫ ТЕПЕРЬ РАБОТАЮТ - command это STRING, не TEXT!
      indexes: [
        {
          fields: ["command"],
          name: "idx_voice_commands_command",
        },
        {
          fields: ["is_active"],
          name: "idx_voice_commands_active",
        },
        {
          fields: ["action_id"],
          name: "idx_voice_commands_action",
        },
      ],

      // 👉 ХУКИ - ТВОИ РОДНЫЕ!
      hooks: {
        beforeValidate: async (command) => {
          if (command.command) {
            command.command = command.command.toLowerCase().trim();
          }
        },
        afterCreate: async (command) => {
          console.log(
            `[VOICE COMMAND CREATED] "${command.command}" for action ${command.actionId}`,
          );
        },
      },


      scopes: {
        active: {
          where: { is_active: true },
        },
        byLanguage: (lang) => ({
          where: { language: lang },
        }),
        highPriority: {
          where: {
            priority: {
              [sequelize.Sequelize.Op.gte]: 50,
            },
          },
        },
        mostUsed: {
          order: [["usage_count", "DESC"]],
        },
        ordered: {
          order: [
            ["sort_order", "ASC"],
            ["priority", "DESC"],
            ["command", "ASC"],
          ],
        },
      },
    },
  );

  // 👉 МЕТОДЫ ЭКЗЕМПЛЯРА
  VoiceCommand.prototype.registerUse = async function () {
    this.usageCount = (this.usageCount || 0) + 1;
    this.lastUsed = new Date();
    return this.save();
  };

  VoiceCommand.findByCommand = async function (command, language = "ru-RU") {
    return this.findOne({
      where: {
        command: command.toLowerCase().trim(),
        language,
        is_active: true,
      },
      include: [
        {
          association: "action",
          include: [{ association: "device" }],
        },
      ],
    });
  };

  return VoiceCommand;
};