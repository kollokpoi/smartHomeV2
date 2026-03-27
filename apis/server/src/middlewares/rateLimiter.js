const rateLimit = require('express-rate-limit');

// Общий лимитер для всех запросов
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 100 запросов с одного IP
  message: {
    success: false,
    message: 'Слишком много запросов, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий лимитер для аутентификации (защита от brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа
  message: {
    success: false,
    message: 'Слишком много попыток входа, попробуйте через 15 минут'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter
};
