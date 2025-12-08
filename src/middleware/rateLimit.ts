import rateLimit from 'express-rate-limit';

// Основной рейт-лимит: 100 запросов в минуту для IP
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 100, // ограничение на 100 запросов за 1 минуту на IP
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Повышенный рейт-лимит для чувствительных маршрутов (например, аутентификация)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // ограничение на 5 попыток аутентификации за 15 минут на IP
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Рейт-лимит для запросов к API в целом для авторизованных пользователей
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 200, // ограничение на 200 запросов в минуту для аутентифицированных пользователей
  message: {
    error: 'Too many requests from this user, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});