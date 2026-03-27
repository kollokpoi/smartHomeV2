// routes/voiceCommandRoutes.js
const express = require('express');
const router = express.Router();
const {voiceCommandController} = require('../controllers');
const { validate } = require('../middlewares/validate');
const { voiceCommandValidator } = require('../helpers/validators');
const multer = require('multer');
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/stats', voiceCommandController.getStats);
router.get('/', voiceCommandController.getAll);
router.get('/action/:actionId', voiceCommandController.getByAction);
router.post('/', validate(voiceCommandValidator.validate), voiceCommandController.create);

router.post('/bulk', voiceCommandController.bulkCreate);
router.delete('/bulk', voiceCommandController.bulkDelete);
router.delete('/:id', voiceCommandController.delete);

router.post('/process', upload.single('audio'), voiceCommandController.process);
router.put('/:id', validate(voiceCommandValidator.validate, true), voiceCommandController.update);
router.post('/', validate(voiceCommandValidator.validate), voiceCommandController.create);

module.exports = router;