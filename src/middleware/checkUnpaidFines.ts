import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { Fine, FineStatus } from '../entities/Fine';

export interface CustomRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export const checkUnpaidFines = async (req: CustomRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    // Проверяем, есть ли аутентифицированный пользователь
    const userId = req.user?.id;

    if (!userId) {
      // Если пользователь не аутентифицирован, позволяем продолжить (пусть middleware аутентификации разберётся)
      return next();
    }

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
      return res.status(403).json({
        error: 'User has unpaid fines',
        details: 'Cannot proceed with this action until fines are paid',
        unpaid_fine: {
          id: unpaidFine.id,
          type: unpaidFine.type,
          amount: unpaidFine.amount,
          description: unpaidFine.description,
          due_date: unpaidFine.due_date
        }
      });
    }

    // Если нет неоплаченных штрафов, продолжаем выполнение
    next();
  } catch (error) {
    console.error('Error in checkUnpaidFines middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};