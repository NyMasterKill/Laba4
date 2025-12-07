import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 6.1.3. POST /payments/init
router.post('/init', authMiddleware, PaymentController.initPayment);

// 6.1.4. POST /payments/callback
router.post('/callback', PaymentController.paymentCallback); // Колбэк не требует аутентификации, т.к. приходит от внешней системы

// 6.1.5. GET /payments/:id/status - получение статуса платежа
router.get('/:id/status', authMiddleware, PaymentController.getPaymentStatus);

export default router;