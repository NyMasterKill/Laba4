import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/Payment';
import { User } from '../entities/User';

export class PaymentController {
  // 6.1.3. Реализовать POST /payments/init
  static async initPayment = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { amount, description, user_id } = req.body;
      const authenticated_user_id = (req as any).user?.id;

      // Проверка, что пользователь аутентифицирован
      if (!authenticated_user_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Проверка, что пользователь пытается сделать платеж для себя
      if (user_id !== authenticated_user_id) {
        return res.status(403).json({ error: 'Forbidden: cannot make payment for another user' });
      }

      // Валидация данных
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
      }

      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      // Создание платежной сессии с T-bank (заглушка)
      // В реальной интеграции здесь будет вызов API T-bank
      const tbankSessionId = `tbank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Создание записи о платеже
      const paymentRepository = getRepository(Payment);
      const userRepository = getRepository(User);
      
      const user = await userRepository.findOne({ where: { id: user_id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const payment = new Payment();
      payment.amount = amount;
      payment.status = PaymentStatus.PENDING;
      payment.method = PaymentMethod.T_BANK;
      payment.transaction_id = tbankSessionId;
      payment.description = description;
      payment.user = user;

      const savedPayment = await paymentRepository.save(payment);

      // Возвращаем данные для инициализации платежа через T-bank
      return res.status(201).json({
        message: 'Payment initialized successfully',
        payment_id: savedPayment.id,
        session_id: tbankSessionId,
        amount: savedPayment.amount,
        description: savedPayment.description,
        payment_url: `https://tbank.example.com/pay/${tbankSessionId}`, // Моковый URL
        status: savedPayment.status,
      });
    } catch (error) {
      console.error('Error initializing payment:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.1.4. Реализовать POST /payments/callback
  static async paymentCallback = async (req: Request, res: Response): Promise<Response> => {
    try {
      // В реальной интеграции здесь нужно:
      // 1. Проверить подпись запроса от T-bank
      // 2. Подтвердить, что это действительно T-bank
      // 3. Обновить статус платежа
      
      const { transaction_id, status, amount, signature } = req.body;
      
      // Валидация данных
      if (!transaction_id || !status) {
        return res.status(400).json({ error: 'Transaction ID and status are required' });
      }

      const paymentRepository = getRepository(Payment);
      
      // Найти платеж по ID транзакции
      const payment = await paymentRepository.findOne({
        where: { transaction_id: transaction_id },
        relations: ['user']
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Обновить статус платежа в зависимости от ответа от T-bank
      let newStatus: PaymentStatus;
      switch (status.toLowerCase()) {
        case 'success':
        case 'completed':
          newStatus = PaymentStatus.COMPLETED;
          break;
        case 'failed':
        case 'error':
          newStatus = PaymentStatus.FAILED;
          break;
        default:
          newStatus = payment.status; // не меняем статус, если неизвестный статус
      }

      // Обновляем статус платежа
      payment.status = newStatus;
      await paymentRepository.save(payment);

      // TODO: здесь можно добавить логику для отправки уведомлений пользователю
      // TODO: при успешном платеже можно обновить баланс пользователя или активировать подписку

      console.log(`Payment ${payment.id} status updated to ${newStatus} via callback from T-bank`);

      // Ответ, подтверждающий получение колбэка
      return res.status(200).json({ 
        message: 'Callback processed successfully',
        payment_id: payment.id,
        new_status: newStatus,
      });
    } catch (error) {
      console.error('Error processing payment callback:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.1.5. Обработка успеха/ошибки оплаты
  static async getPaymentStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { payment_id } = req.params;
      const authenticated_user_id = (req as any).user?.id;

      if (!authenticated_user_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const paymentRepository = getRepository(Payment);
      
      const payment = await paymentRepository.findOne({
        where: { 
          id: payment_id 
        },
        relations: ['user']
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Проверяем, что пользователь запрашивает статус своего платежа
      if (payment.user.id !== authenticated_user_id) {
        return res.status(403).json({ error: 'Forbidden: cannot access another user\'s payment' });
      }

      return res.status(200).json({
        payment_id: payment.id,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        description: payment.description,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}