// controllers/speechController.js
const speechRecognizer = require('../../services/speechRecognizer');
class SpeechController {
    async recognize(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No audio file provided'
                });
            }

            const text = await speechRecognizer.recognize(req.file.buffer);
            
            res.json({
                success: true,
                data: text
            });
        } catch (error) {
            next(error);
        }
    }
    
    async recognizeBase64(req, res, next) {
        try {
            const { audio } = req.body;
            
            if (!audio) {
                return res.status(400).json({
                    success: false,
                    error: 'No audio data provided'
                });
            }
            
            const audioBuffer = Buffer.from(audio, 'base64');
            const text = await speechRecognizer.recognize(audioBuffer);
            
            res.json({
                success: true,
                data: text
            });
        } catch (error) {
            next(error);
        }
    }
    
    async getStatus(req, res, next) {
        try {
            res.json({
                success: true,
                ready: speechRecognizer.ready
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SpeechController();