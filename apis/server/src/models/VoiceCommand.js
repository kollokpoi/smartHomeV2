// models/VoiceCommand.js
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
        set(value) {
          this.setDataValue("command", value.toLowerCase().trim());
        },
      },
      language: {
        type: DataTypes.STRING(10),
        defaultValue: "ru-RU",
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      },
    },
    {
      tableName: "voice_commands",
      timestamps: true,
      underscored: true,

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