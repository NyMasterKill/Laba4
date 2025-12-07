import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';
import { authMiddleware } from '../middleware/authMiddleware'; // Импортируем middleware

const router = Router();
const bookingController = new BookingController();

// POST /api/bookings
// authMiddleware проверяет JWT и добавляет данные пользователя в req
router.post('/bookings', authMiddleware, (req, res) => bookingController.createBooking(req, res));

export default router;