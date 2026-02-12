// routes/index.js
const express = require('express');
const router = express.Router();
const deviceRoutes = require('./deviceRoutes');
const actionRoutes = require('./actionRoutes');
const actionParameterRoutes = require('./actionParameterRoutes');
const voiceCommandRoutes = require('./voiceCommandRoutes');

router.use('/devices', deviceRoutes);
router.use('/actions', actionRoutes);
router.use('/action-parameters', actionParameterRoutes);
router.use('/voice-commands', voiceCommandRoutes);

module.exports = router;