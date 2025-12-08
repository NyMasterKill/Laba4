import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { SupportTicket, TicketStatus } from '../entities/SupportTicket';
import { Message, MessageType } from '../entities/Message';
import { SupportTicketService } from '../services/SupportTicketService';
import { MessageService } from '../services/MessageService';
import { User } from '../entities/User';

export class SupportTicketController {
  // Создать новый тикет поддержки
  static async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const { title, description } = req.body;
      const userId = (req as any).user?.id; // предполагаем, что user прикреплен к req через middleware

      if (!title || !description) {
        res.status(400).json({ error: 'Title and description are required' });
        return;
      }

      const ticket = await SupportTicketService.createTicket(userId, title, description);

      res.status(201).json(ticket);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получить все тикеты пользователя
  static async getUserTickets(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      const tickets = await SupportTicketService.getUserTickets(userId);

      res.status(200).json(tickets);
    } catch (error) {
      console.error('Error getting user tickets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получить конкретный тикет и его сообщения
  static async getTicket(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const userId = (req as any).user?.id;

      // Проверяем, принадлежит ли тикет пользователю (или пользователь - админ)
      const ticket = await SupportTicketService.getTicketById(ticketId);

      if (!ticket || ticket.user_id !== userId) {
        res.status(404).json({ error: 'Ticket not found or access denied' });
        return;
      }

      res.status(200).json(ticket);
    } catch (error) {
      console.error('Error getting ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Закрыть тикет
  static async closeTicket(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const userId = (req as any).user?.id;

      // Проверяем, принадлежит ли тикет пользователю
      const ticket = await getRepository(SupportTicket).findOneBy({ id: ticketId });
      if (!ticket || ticket.user_id !== userId) {
        res.status(404).json({ error: 'Ticket not found or access denied' });
        return;
      }

      const updatedTicket = await SupportTicketService.updateTicketStatus(ticketId, TicketStatus.CLOSED);

      res.status(200).json(updatedTicket);
    } catch (error) {
      console.error('Error closing ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Отправить сообщение в тикет
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { content } = req.body;
      const userId = (req as any).user?.id;

      if (!content) {
        res.status(400).json({ error: 'Message content is required' });
        return;
      }

      // Проверяем, принадлежит ли тикет пользователю
      const ticket = await getRepository(SupportTicket).findOneBy({ id: ticketId });
      if (!ticket || ticket.user_id !== userId) {
        res.status(404).json({ error: 'Ticket not found or access denied' });
        return;
      }

      const message = await MessageService.createMessage(
        ticketId,
        content,
        MessageType.USER,
        userId
      );

      // Обновляем статус тикета на "in_progress" при получении сообщения от пользователя
      if (ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.RESOLVED) {
        await SupportTicketService.updateTicketStatus(ticketId, TicketStatus.IN_PROGRESS);
      }

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Получить сообщения тикета
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const userId = (req as any).user?.id;

      // Проверяем, принадлежит ли тикет пользователю
      const ticket = await getRepository(SupportTicket).findOneBy({ id: ticketId });
      if (!ticket || ticket.user_id !== userId) {
        res.status(404).json({ error: 'Ticket not found or access denied' });
        return;
      }

      const messages = await MessageService.getMessagesByTicket(ticketId);

      res.status(200).json(messages);
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Админ-метод: получить все тикеты
  static async getAllTickets(req: Request, res: Response): Promise<void> {
    try {
      // Проверяем, является ли пользователь администратором (реализация зависит от вашей системы аутентификации)
      const userRole = (req as any).user?.role;
      if (userRole !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const tickets = await SupportTicketService.getAllTickets();

      res.status(200).json(tickets);
    } catch (error) {
      console.error('Error getting all tickets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Админ-метод: ответить в тикет
  static async adminReply(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { content } = req.body;
      const adminId = (req as any).user?.id;
      const adminRole = (req as any).user?.role;

      if (adminRole !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (!content) {
        res.status(400).json({ error: 'Message content is required' });
        return;
      }

      // Проверяем, существует ли тикет
      const ticket = await getRepository(SupportTicket).findOneBy({ id: ticketId });
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      const message = await MessageService.createMessage(
        ticketId,
        content,
        MessageType.SUPPORT,
        adminId
      );

      // Обновляем статус тикета на "in_progress" при ответе поддержки
      if (ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.RESOLVED) {
        await SupportTicketService.updateTicketStatus(ticketId, TicketStatus.IN_PROGRESS);
      }

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending admin reply:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}