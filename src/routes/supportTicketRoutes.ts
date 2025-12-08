import { Router } from 'express';
import { SupportTicketController } from '../controllers/SupportTicketController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Маршруты для тикетов
router.post('/', authMiddleware, SupportTicketController.createTicket); // Создать тикет
router.get('/', authMiddleware, SupportTicketController.getUserTickets); // Получить тикеты пользователя
router.get('/:ticketId', authMiddleware, SupportTicketController.getTicket); // Получить конкретный тикет
router.patch('/:ticketId/close', authMiddleware, SupportTicketController.closeTicket); // Закрыть тикет

// Маршруты для сообщений
router.get('/:ticketId/messages', authMiddleware, SupportTicketController.getMessages); // Получить сообщения тикета
router.post('/:ticketId/messages', authMiddleware, SupportTicketController.sendMessage); // Отправить сообщение

// Маршруты для администраторов
router.get('/admin/tickets', authMiddleware, SupportTicketController.getAllTickets); // Получить все тикеты
router.post('/admin/tickets/:ticketId/messages', authMiddleware, SupportTicketController.adminReply); // Ответить в тикет

export default router;