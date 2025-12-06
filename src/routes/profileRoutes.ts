import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const profileController = new ProfileController();

// GET /users/me - получить профиль текущего пользователя
router.get('/users/me', authMiddleware, (req, res) => profileController.getCurrentUserProfile(req, res));

// PATCH /profile - обновить профиль текущего пользователя
router.patch('/profile', authMiddleware, (req, res) => profileController.updateProfile(req, res));

export default router;