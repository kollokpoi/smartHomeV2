// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { userController } = require("../controllers");
const { validate } = require("../middlewares/validate");
const { userValidator } = require("../helpers/validators");

router.get("/", userController.list);
router.get("/:id", userController.getById);
router.post("/", validate(userValidator.validate), userController.create);
router.put(
  "/:id",
  validate(userValidator.validate, true),
  userController.update,
);
router.delete("/:id", userController.delete);

module.exports = router;
