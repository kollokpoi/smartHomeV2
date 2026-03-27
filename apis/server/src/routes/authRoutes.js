const {authController} = require('../controllers')
const router = require("express").Router();

router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);

module.exports = router;