// routes/actionParameterRoutes.js
const express = require('express');
const router = express.Router();
const actionParameterController = require('../controllers/actionParameterController');
const { validate } = require('../middlewares/validate');
const { parameterValidator } = require('../helpers/validators');

// Статистика
router.get('/stats', actionParameterController.getStats);

// Валидация значения
router.post('/validate', actionParameterController.validate);

// Массовые операции
router.post('/bulk', actionParameterController.bulkCreate);
router.delete('/bulk', actionParameterController.bulkDelete);
router.post('/clone', actionParameterController.clone);

// Экспорт/Импорт
router.get('/export/:actionId', actionParameterController.export);
router.post('/import', actionParameterController.import);

// CRUD операции
router.get('/action/:actionId', actionParameterController.getByAction);
router.get('/', actionParameterController.getAll);
router.get('/:id', actionParameterController.getById);
router.post('/', validate(parameterValidator.validate), actionParameterController.create);
router.put('/:id', validate(parameterValidator.validate, true), actionParameterController.update);
router.patch('/:id', actionParameterController.patch);
router.delete('/:id', actionParameterController.delete);

module.exports = router;