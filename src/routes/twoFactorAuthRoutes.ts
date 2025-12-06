import { Router } from 'express';
import { TwoFactorAuthController } from '../controllers/TwoFactorAuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const twoFactorAuthController = new TwoFactorAuthController();

// Запрос 2FA кода
router.post('/2fa/request', (req, res) => twoFactorAuthController.request2FACode(req, res));

// Проверка 2FA кода
router.post('/2fa/verify', (req, res) => twoFactorAuthController.verify2FACode(req, res));

export default router;