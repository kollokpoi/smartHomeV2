// routes/actionRoutes.js
const express = require('express');
const router = express.Router();
const {actionController} = require('../controllers');
const { validate } = require('../middlewares/validate');
const { actionValidator } = require('../helpers/validators');

router.get('/device/:deviceId', actionController.getByDevice);
router.get('/', actionController.getAll);
router.get('/:id', actionController.getById);
router.post('/', validate(actionValidator.validate), actionController.create);
router.post('/:id/execute', actionController.execute);
router.put('/:id', validate(actionValidator.validate, true), actionController.update);
router.delete('/:id', actionController.delete);

module.exports = router;