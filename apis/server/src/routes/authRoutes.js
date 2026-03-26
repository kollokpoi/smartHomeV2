const constroller = require("../controllers/authController");
const router = require("express").Router();

router.post("/login", constroller.login);
router.post("/refresh-token", constroller.refreshToken);

module.exports = router;