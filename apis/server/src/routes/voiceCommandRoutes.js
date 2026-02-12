// routes/voiceCommandRoutes.js
const express = require('express');
const router = express.Router();
const voiceCommandController = require('../controllers/voiceCommandController');
const { validate } = require('../middlewares/validate');
const { voiceCommandValidator } = require('../helpers/validators');

router.get('/stats', voiceCommandController.getStats);
router.get('/action/:actionId', voiceCommandController.getByAction);
router.post('/', validate(voiceCommandValidator.validate), voiceCommandController.create);
router.post('/process', voiceCommandController.process);
router.put('/:id', validate(voiceCommandValidator.validate, true), voiceCommandController.update);
router.delete('/:id', voiceCommandController.delete);

module.exports = router;