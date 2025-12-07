import { Router } from 'express';
import { RideController } from '../controllers/RideController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 5.1. POST /rides/start - старт поездки
router.post('/start', authMiddleware, RideController.startRide);

// 5.2. GET /rides/check-booking/:booking_id - проверка брони пользователя
router.get('/check-booking/:booking_id', authMiddleware, RideController.checkUserBooking);

// Маршрут для завершения поездки (понадобится в дальнейшем)
router.put('/:id/finish', authMiddleware, async (req, res) => {
  // Пока что просто заглушка - будет реализовано в следующем спринте
  return res.status(200).json({ message: 'Ride finish endpoint' });
});

export default router;