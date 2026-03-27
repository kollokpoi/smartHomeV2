const express = require('express');
const router = express.Router();
const multer = require('multer');
const speechController = require('../controllers/speechController');

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/recognize', upload.single('audio'), speechController.recognize);
router.post('/recognize-base64', speechController.recognizeBase64);
router.get('/recognize/status', speechController.getStatus);

module.exports = router;