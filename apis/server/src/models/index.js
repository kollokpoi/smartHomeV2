const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'smarthome',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '192.168.0.3',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Инициализация моделей
const Device = require('./Device')(sequelize, DataTypes);
const Action = require('./Action')(sequelize, DataTypes);
const ActionParameter = require('./ActionParameter')(sequelize, DataTypes);
const VoiceCommand = require('./VoiceCommand')(sequelize, DataTypes);

// Связи
Device.hasMany(Action, { 
  as: 'actions', 
  foreignKey: 'device_id',
  onDelete: 'CASCADE'
});

Action.belongsTo(Device, { 
  as: 'device',
  foreignKey: 'device_id' 
});

Action.hasMany(ActionParameter, { 
  as: 'parameters', 
  foreignKey: 'action_id',
  onDelete: 'CASCADE'
});

ActionParameter.belongsTo(Action, { 
  as: 'action',
  foreignKey: 'action_id' 
});

Action.hasMany(VoiceCommand, { 
  as: 'voiceCommands', 
  foreignKey: 'action_id',
  onDelete: 'CASCADE'
});

VoiceCommand.belongsTo(Action, { 
  as: 'action',
  foreignKey: 'action_id' 
});

module.exports = {
  sequelize,
  Device,
  Action,
  ActionParameter,
  VoiceCommand
};