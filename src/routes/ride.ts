import { Router } from 'express';
import { RideController } from '../controllers/RideController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 5.1. POST /rides/start - старт поездки
router.post('/start', authMiddleware, RideController.startRide);

export default router;