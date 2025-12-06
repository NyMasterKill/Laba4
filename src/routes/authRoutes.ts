import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

// Проверка сессии при старте приложения
router.get('/auth/session', (req, res) => authController.checkSession(req, res));

// Выход из системы
router.post('/auth/logout', authMiddleware, (req, res) => authController.logout(req, res));

export default router;