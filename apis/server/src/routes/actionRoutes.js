const express = require('express');
const router = express.Router();
const { actionController } = require('../controllers');
const { validate } = require('../middlewares/validate');
const { actionValidator } = require('../helpers/validators');

router.get('/device/:deviceId', actionController.getByDevice);
router.get('/delayed', actionController.getDelayedActions);
router.get('/', actionController.getAll);
router.get('/:id', actionController.getById);
router.post('/', validate(actionValidator.validate), actionController.create);
router.post('/bulk', actionController.bulkCreate);
router.put('/:id', validate(actionValidator.validate, true), actionController.update);
router.delete('/:id', actionController.delete);

router.post('/:id/execute', actionController.execute);
router.post('/:id/register-call', actionController.registerCall);

router.delete('/delayed/:taskId', actionController.cancelDelayedAction);
router.delete('/delayed/action/:actionId', actionController.cancelAllDelayedByAction);

module.exports = router;