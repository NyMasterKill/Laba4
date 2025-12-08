import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { BookingService } from '../services/BookingService';
import { AuthenticatedRequest } from '../middleware/authMiddleware'; // Импортируем типизированный Request
import { Fine, FineStatus } from '../entities/Fine';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  async createBooking(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Получаем ID пользователя из объекта запроса, добавленного authMiddleware
      const userId = req.user?.id;

      if (!userId) {
        // Это вряд ли произойдёт, если middleware сработал корректно
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // 7.4.1. Реализовать middleware: checkUnpaidFines(user_id)
      // Проверяем, есть ли у пользователя неоплаченные штрафы
      const fineRepository = getRepository(Fine);

      const unpaidFine = await fineRepository.findOne({
        where: {
          user_id: userId,
          status: FineStatus.PENDING
        }
      });

      if (unpaidFine) {
        // 7.4.2. Возврат 403 Forbidden при наличии штрафов
        res.status(403).json({
          error: 'User has unpaid fines',
          details: 'Cannot create a new booking until fines are paid',
          unpaid_fine: {
            id: unpaidFine.id,
            type: unpaidFine.type,
            amount: unpaidFine.amount,
            description: unpaidFine.description,
            due_date: unpaidFine.due_date
          }
        });
        return;
      }

      const { vehicleId } = req.body;

      if (!vehicleId) {
        res.status(400).json({ message: 'Vehicle ID is required' });
        return;
      }

      const booking = await this.bookingService.createBooking(userId, vehicleId);

      res.status(201).json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      // Обработка ошибок из сервиса (NotFoundError, BadRequestError)
      if (error instanceof Error && ['NotFoundError', 'BadRequestError'].includes(error.constructor.name)) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}