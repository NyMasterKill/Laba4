import { Router } from 'express';
import { RideController } from '../controllers/RideController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 5.1. POST /rides/start - старт поездки
router.post('/start', authMiddleware, RideController.startRide);

// 5.2. GET /rides/check-booking/:booking_id - проверка брони пользователя
router.get('/check-booking/:booking_id', authMiddleware, RideController.checkUserBooking);

// 7.1. PUT /rides/:id/finish - завершение поездки
router.put('/:id/finish', authMiddleware, RideController.finishRide);

export default router;