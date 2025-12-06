import { Router } from 'express';
import { GosuslugiController } from '../controllers/GosuslugiController';

const router = Router();
const gosuslugiController = new GosuslugiController();

// OAuth2 authorization endpoint
router.get('/auth/gosuslugi/login', (req, res) => gosuslugiController.initiateAuth(req, res));

// OAuth2 callback endpoint
router.get('/auth/gosuslugi/callback', (req, res) => gosuslugiController.handleCallback(req, res));

// Token refresh endpoint
router.post('/auth/refresh', (req, res) => gosuslugiController.refreshTokens(req, res));

export default router;