import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { TariffPlan } from '../entities/TariffPlan';
import { Subscription, SubscriptionStatus } from '../entities/Subscription';
import { User } from '../entities/User';

export class TariffSubscriptionController {
  // 6.4.2. CRUD API: GET /tariffs - получение списка тарифных планов
  static async getAllTariffPlans = async (req: Request, res: Response): Promise<Response> => {
    try {
      const tariffPlanRepository = getRepository(TariffPlan);
      
      const tariffPlans = await tariffPlanRepository.find({
        where: { 
          is_active: true // Показываем только активные тарифные планы
        }
      });

      return res.status(200).json({
        message: 'Tariff plans retrieved successfully',
        tariff_plans: tariffPlans
      });
    } catch (error) {
      console.error('Error getting tariff plans:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.4.2. CRUD API: GET /tariffs/:id - получение конкретного тарифного плана
  static async getTariffPlanById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const tariffPlanRepository = getRepository(TariffPlan);
      
      const tariffPlan = await tariffPlanRepository.findOne({
        where: { id: id }
      });

      if (!tariffPlan) {
        return res.status(404).json({ error: 'Tariff plan not found' });
      }

      return res.status(200).json({
        message: 'Tariff plan retrieved successfully',
        tariff_plan: tariffPlan
      });
    } catch (error) {
      console.error('Error getting tariff plan by id:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.4.2. CRUD API: POST /tariffs - создание тарифного плана (административная функция)
  static async createTariffPlan = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { name, description, price, free_minutes } = req.body;
      const tariffPlanRepository = getRepository(TariffPlan);
      
      // Валидация данных
      if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
      }

      if (price < 0) {
        return res.status(400).json({ error: 'Price cannot be negative' });
      }

      // Создание нового тарифного плана
      const tariffPlan = new TariffPlan();
      tariffPlan.name = name;
      tariffPlan.description = description || '';
      tariffPlan.price = price;
      tariffPlan.free_minutes = free_minutes || 0;
      tariffPlan.is_active = true; // новый тариф по умолчанию активен

      const savedTariffPlan = await tariffPlanRepository.save(tariffPlan);

      return res.status(201).json({
        message: 'Tariff plan created successfully',
        tariff_plan: savedTariffPlan
      });
    } catch (error) {
      console.error('Error creating tariff plan:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.4.2. CRUD API: PUT /tariffs/:id - обновление тарифного плана
  static async updateTariffPlan = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { name, description, price, free_minutes, is_active } = req.body;
      const tariffPlanRepository = getRepository(TariffPlan);
      
      const existingTariff = await tariffPlanRepository.findOne({
        where: { id: id }
      });

      if (!existingTariff) {
        return res.status(404).json({ error: 'Tariff plan not found' });
      }

      // Обновление полей, если они предоставлены
      if (name !== undefined) existingTariff.name = name;
      if (description !== undefined) existingTariff.description = description;
      if (price !== undefined) {
        if (price < 0) {
          return res.status(400).json({ error: 'Price cannot be negative' });
        }
        existingTariff.price = price;
      }
      if (free_minutes !== undefined) existingTariff.free_minutes = free_minutes;
      if (is_active !== undefined) existingTariff.is_active = is_active;

      const updatedTariff = await tariffPlanRepository.save(existingTariff);

      return res.status(200).json({
        message: 'Tariff plan updated successfully',
        tariff_plan: updatedTariff
      });
    } catch (error) {
      console.error('Error updating tariff plan:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.4.2. CRUD API: DELETE /tariffs/:id - удаление тарифного плана
  static async deleteTariffPlan = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const tariffPlanRepository = getRepository(TariffPlan);
      
      const existingTariff = await tariffPlanRepository.findOne({
        where: { id: id }
      });

      if (!existingTariff) {
        return res.status(404).json({ error: 'Tariff plan not found' });
      }

      // NOTE: В реальной системе, возможно, стоит помечать как неактивный, а не удалять
      // чтобы сохранить исторические данные
      await tariffPlanRepository.remove(existingTariff);

      return res.status(200).json({
        message: 'Tariff plan deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tariff plan:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.4.2. CRUD API: GET /subscriptions - получение подписок пользователя
  static async getUserSubscriptions = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user_id = (req as any).user?.id; // assuming JWT middleware adds user to req

      if (!user_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const subscriptionRepository = getRepository(Subscription);
      
      const subscriptions = await subscriptionRepository.find({
        where: { 
          user_id: user_id 
        },
        relations: ['tariff_plan']
      });

      return res.status(200).json({
        message: 'User subscriptions retrieved successfully',
        subscriptions: subscriptions
      });
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.4.2. CRUD API: GET /subscriptions/:id - получение конкретной подписки
  static async getSubscriptionById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const user_id = (req as any).user?.id; // assuming JWT middleware adds user to req

      if (!user_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const subscriptionRepository = getRepository(Subscription);
      
      const subscription = await subscriptionRepository.findOne({
        where: { 
          id: id,
          user_id: user_id 
        },
        relations: ['tariff_plan']
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      return res.status(200).json({
        message: 'Subscription retrieved successfully',
        subscription: subscription
      });
    } catch (error) {
      console.error('Error getting subscription by id:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.4.2. CRUD API: POST /subscriptions - создание подписки (покупка)
  static async createSubscription = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { tariff_plan_id, start_date, end_date } = req.body;
      const user_id = (req as any).user?.id; // assuming JWT middleware adds user to req

      if (!user_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Валидация данных
      if (!tariff_plan_id) {
        return res.status(400).json({ error: 'Tariff plan ID is required' });
      }

      const tariffPlanRepository = getRepository(TariffPlan);
      const subscriptionRepository = getRepository(Subscription);
      const userRepository = getRepository(User);

      // Проверяем, существует ли тарифный план
      const tariffPlan = await tariffPlanRepository.findOne({
        where: { 
          id: tariff_plan_id,
          is_active: true // только активные тарифы можно приобрести
        }
      });

      if (!tariffPlan) {
        return res.status(404).json({ error: 'Tariff plan not found or not active' });
      }

      // Проверяем, что у пользователя нет активной подписки
      const existingActiveSubscription = await subscriptionRepository.findOne({
        where: {
          user_id: user_id,
          status: SubscriptionStatus.ACTIVE,
          start_date: () => '<= NOW()',
          end_date: () => '>= NOW()',
        }
      });

      if (existingActiveSubscription) {
        return res.status(400).json({ 
          error: 'User already has an active subscription',
          details: 'Only one active subscription per user is allowed'
        });
      }

      // Создание новой подписки
      const subscription = new Subscription();
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.start_date = start_date ? new Date(start_date) : new Date();
      subscription.end_date = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // по умолчанию 30 дней
      subscription.used_minutes = 0; // начальное значение
      subscription.user = { id: user_id } as User;
      subscription.tariff_plan = tariffPlan;

      const savedSubscription = await subscriptionRepository.save(subscription);

      return res.status(201).json({
        message: 'Subscription created successfully',
        subscription: savedSubscription
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.4.2. CRUD API: PUT /subscriptions/:id - обновление статуса подписки (например, отмена)
  static async updateSubscription = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { status, start_date, end_date } = req.body;
      const user_id = (req as any).user?.id; // assuming JWT middleware adds user to req

      if (!user_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const subscriptionRepository = getRepository(Subscription);
      
      const existingSubscription = await subscriptionRepository.findOne({
        where: { 
          id: id,
          user_id: user_id 
        }
      });

      if (!existingSubscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Обновление полей, если они предоставлены
      if (status !== undefined) {
        // Проверяем, что статус допустим
        const validStatuses = Object.values(SubscriptionStatus);
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Invalid subscription status' });
        }
        existingSubscription.status = status;
      }
      if (start_date !== undefined) existingSubscription.start_date = new Date(start_date);
      if (end_date !== undefined) existingSubscription.end_date = new Date(end_date);

      const updatedSubscription = await subscriptionRepository.save(existingSubscription);

      return res.status(200).json({
        message: 'Subscription updated successfully',
        subscription: updatedSubscription
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.4.3. Логика продления/отмены
  static async cancelSubscription = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const user_id = (req as any).user?.id; // assuming JWT middleware adds user to req

      if (!user_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const subscriptionRepository = getRepository(Subscription);
      
      const subscription = await subscriptionRepository.findOne({
        where: { 
          id: id,
          user_id: user_id 
        }
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Отменяем подписку
      subscription.status = SubscriptionStatus.CANCELLED;
      const updatedSubscription = await subscriptionRepository.save(subscription);

      return res.status(200).json({
        message: 'Subscription cancelled successfully',
        subscription: updatedSubscription
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}