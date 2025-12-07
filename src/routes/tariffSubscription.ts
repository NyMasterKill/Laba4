import { Router } from 'express';
import { TariffSubscriptionController } from '../controllers/TariffSubscriptionController';
import { authMiddleware } from '../middleware/auth';
// import { adminAuthMiddleware } from '../middleware/adminAuth'; // Предполагаем, что такой middleware существует

const router = Router();

// CRUD API для тарифных планов
// 6.4.2. CRUD API: GET /tariffs, POST /tariffs
router.get('/tariffs', TariffSubscriptionController.getAllTariffPlans); // публичный доступ для просмотра тарифов
router.get('/tariffs/:id', TariffSubscriptionController.getTariffPlanById); // публичный доступ
// Для создания, обновления и удаления тарифных планов, возможно, потребуется административный доступ
// router.post('/tariffs', adminAuthMiddleware, TariffSubscriptionController.createTariffPlan);
// router.put('/tariffs/:id', adminAuthMiddleware, TariffSubscriptionController.updateTariffPlan);
// router.delete('/tariffs/:id', adminAuthMiddleware, TariffSubscriptionController.deleteTariffPlan);

// CRUD API для подписок
// 6.4.2. CRUD API: GET /subscriptions, POST /subscriptions
router.get('/subscriptions', authMiddleware, TariffSubscriptionController.getUserSubscriptions);
router.get('/subscriptions/:id', authMiddleware, TariffSubscriptionController.getSubscriptionById);
router.post('/subscriptions', authMiddleware, TariffSubscriptionController.createSubscription);
router.put('/subscriptions/:id', authMiddleware, TariffSubscriptionController.updateSubscription);

// Дополнительный маршрут для отмены подписки
router.put('/subscriptions/:id/cancel', authMiddleware, TariffSubscriptionController.cancelSubscription);

export default router;