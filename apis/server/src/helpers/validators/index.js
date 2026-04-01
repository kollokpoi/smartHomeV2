const deviceValidator = require('./deviceValidator');
const actionValidator = require('./actionValidator');
const parameterValidator = require('./parameterValidator');
const voiceCommandValidator = require('./voiceCommandValidator');
const userValidator = require('./userValidator')

module.exports = {
  deviceValidator,
  actionValidator,
  parameterValidator,
  userValidator,
  voiceCommandValidator
};