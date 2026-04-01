// routes/index.js
const express = require("express");
const router = express.Router();
const deviceRoutes = require("./deviceRoutes");
const actionRoutes = require("./actionRoutes");
const actionParameterRoutes = require("./actionParameterRoutes");
const voiceCommandRoutes = require("./voiceCommandRoutes");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const speechRoutes = require("./speechRoutes");

const { authenticateToken } = require("../middlewares/auth");
const path = require('path');
router.use("/auth", authRoutes);
router.use("/user", authenticateToken, userRoutes);
router.use("/devices", authenticateToken, deviceRoutes);
router.use("/actions", authenticateToken, actionRoutes);
router.use("/action-parameters", authenticateToken, actionParameterRoutes);
router.use("/voice-commands", authenticateToken, voiceCommandRoutes);
router.use("/speech", authenticateToken, speechRoutes);

router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

