// models/Device.js
module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define(
    "Device",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      ip: {
        type: DataTypes.STRING(45),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      handlerPath: {
        type: DataTypes.STRING(255),
        field: "handler_path"
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
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
        }
      },
      status: {
        type: DataTypes.ENUM("online", "offline", "maintenance"),
        defaultValue: "offline"
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        field: "sort_order",
        defaultValue: 0
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: true
      },
      lastSeen: {
        type: DataTypes.DATE,
        field: "last_seen"
      }
    },
    {
      tableName: "devices",
      timestamps: true,
      underscored: true,

      hooks: {
        beforeValidate: async (device) => {
          if (device.name) {
            device.name = device.name.trim();
          }
          if (device.handlerPath) {
            device.handlerPath = device.handlerPath.startsWith("/")
              ? device.handlerPath
              : `/${device.handlerPath}`;
          }
        },

        afterCreate: async (device) => {
          console.log(`[DEVICE CREATED] ${device.name} (${device.ip})`);
        },

        afterUpdate: async (device) => {
          if (device.changed("status")) {
            console.log(`[DEVICE STATUS] ${device.name} -> ${device.status}`);
          }
        },

        beforeDestroy: async (device) => {
          console.log(`[DEVICE DELETED] ${device.name}`);
        }
      },

      scopes: {
        online: {
          where: { status: "online" }
        },
        offline: {
          where: { status: "offline" }
        },
        withActions: {
          include: [{ association: "actions" }]
        },
        active: {
          where: { is_active: true }
        },
        ordered: {
          order: [
            ["sort_order", "ASC"],
            ["name", "ASC"]
          ]
        },
        recentlyActive: {
          where: {
            lastSeen: {
              [sequelize.Sequelize.Op.gte]: sequelize.Sequelize.literal(
                "DATE_SUB(NOW(), INTERVAL 1 HOUR)"
              )
            }
          }
        }
      }
    }
  );

  Device.prototype.updateLastSeen = async function () {
    this.lastSeen = new Date();
    this.status = "online";
    return this.save();
  };

  Device.getStats = async function () {
    const total = await this.count();
    const online = await this.scope("online").count();
    const maintenance = await this.count({ where: { status: "maintenance" } });

    return {
      total,
      online,
      offline: total - online - maintenance,
      maintenance
    };
  };

  return Device;
};