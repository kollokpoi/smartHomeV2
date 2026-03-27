// routes/index.js
const express = require('express');
const router = express.Router();
const deviceRoutes = require('./deviceRoutes');
const actionRoutes = require('./actionRoutes');
const actionParameterRoutes = require('./actionParameterRoutes');
const voiceCommandRoutes = require('./voiceCommandRoutes');
const authRoutes = require('./authRoutes');
const speechRoutes = require('./speechRoutes')

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/actions', actionRoutes);
router.use('/action-parameters', actionParameterRoutes);
router.use('/voice-commands', voiceCommandRoutes);
router.use('/speech', speechRoutes);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;