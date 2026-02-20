// routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const {deviceController} = require('../controllers');
const { validate } = require('../middlewares/validate');
const { deviceValidator } = require('../helpers/validators');

router.get('/stats', deviceController.getStats);
router.get('/', deviceController.getAll);
router.get('/:id', deviceController.getById);
router.post('/', validate(deviceValidator.validate), deviceController.create);
router.put('/:id', validate(deviceValidator.validate, true), deviceController.update);
router.delete('/:id', deviceController.delete);
router.patch('/:id/status', deviceController.updateStatus);

module.exports = router;