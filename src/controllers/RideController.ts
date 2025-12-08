import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Ride } from '../entities/Ride';
import { Booking } from '../entities/Booking';
import { Vehicle } from '../entities/Vehicle';
import { User } from '../entities/User';
import { Subscription, SubscriptionStatus } from '../entities/Subscription';
import { TariffPlan } from '../entities/TariffPlan';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/Payment';
import { BookingStatus, RideStatus } from '../entities/Booking';
import { RideTrackingService } from '../services/RideTrackingService';

export class RideController {
  // 5.2. Проверка: есть ли бронь у пользователя, не истёк ли срок
  static async checkUserBooking = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { booking_id } = req.params;
      const user_id = (req as any).user?.id; // assuming JWT middleware adds user to req

      if (!booking_id) {
        return res.status(400).json({ error: 'Booking ID is required' });
      }

      if (!user_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const bookingRepository = getRepository(Booking);
      const booking = await bookingRepository.findOne({
        where: {
          id: booking_id,
          user_id: user_id
        }
      });

      if (!booking) {
        return res.status(404).json({
          error: 'Booking not found',
          details: 'Booking does not exist or does not belong to the user'
        });
      }

      // Проверка, истекла ли бронь
      const currentTime = new Date();
      if (booking.end_time < currentTime) {
        return res.status(400).json({
          error: 'Booking expired',
          expiry_time: booking.end_time,
          details: 'The booking period has expired'
        });
      }

      // Проверка статуса брони
      if (booking.status !== BookingStatus.ACTIVE) {
        return res.status(400).json({
          error: 'Invalid booking status',
          status: booking.status,
          details: 'Booking is not active'
        });
      }

      // 5.2.3. Логгирование попытов старта без брони
      console.log(`Booking validation successful for user ${user_id}, booking ${booking_id}`);

      return res.status(200).json({
        booking: {
          id: booking.id,
          status: booking.status,
          start_time: booking.start_time,
          end_time: booking.end_time,
          vehicle_id: booking.vehicle_id,
          is_valid: true
        }
      });
    } catch (error) {
      console.error('Error checking user booking:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 5.1. POST /rides/start - старт поездки
  static async startRide = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { booking_id } = req.body;
      const user_id = (req as any).user?.id; // assuming JWT middleware adds user to req

      // 5.1.1. Валидация: booking_id, user_id (JWT)
      if (!booking_id) {
        return res.status(400).json({ error: 'Booking ID is required' });
      }

      if (!user_id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // 5.1.2. Проверка: бронь активна и не истекла
      const validationResponse = await RideController.validateBookingForRide(booking_id, user_id);
      if (!validationResponse.isValid) {
        return res.status(validationResponse.statusCode).json({ error: validationResponse.message });
      }

      // 6.3. Проверка подписки перед стартом поездки
      const subscriptionCheck = await RideController.checkUserSubscription(user_id);
      if (!subscriptionCheck.isEligible) {
        return res.status(403).json({
          error: 'User does not have an active subscription or has exceeded free minute limit',
          details: subscriptionCheck.details
        });
      }

      // 5.1.3. Создание записи в rides
      const rideRepository = getRepository(Ride);

      const newRide = new Ride();
      newRide.status = RideStatus.IN_PROGRESS;
      newRide.start_time = new Date();
      newRide.user = { id: user_id } as User;
      newRide.vehicle = validationResponse.booking.vehicle as Vehicle;
      newRide.booking = { id: booking_id } as Booking;

      // Устанавливаем начальные координаты из транспорта
      if (validationResponse.booking.vehicle && validationResponse.booking.vehicle.current_lat && validationResponse.booking.vehicle.current_lng) {
        newRide.start_lat = validationResponse.booking.vehicle.current_lat;
        newRide.start_lng = validationResponse.booking.vehicle.current_lng;
      }

      const savedRide = await rideRepository.save(newRide);

      // 5.3. Обновление vehicle.status = in_ride, скрытие с карты
      const vehicleRepository = getRepository(Vehicle);
      const vehicle = await vehicleRepository.findOne({ where: { id: validationResponse.booking.vehicle_id } });

      if (vehicle) {
        // 5.3.1. UPDATE vehicles SET status = 'in_ride'
        vehicle.status = 'in_ride';
        await vehicleRepository.save(vehicle);

        // 5.3.2. Скрытие транспорта с карты (публикация события)
        // Это может быть реализовано через WebSocket или SSE, чтобы уведомить клиентов
        // о смене статуса транспорта и необходимости обновить отображение на карте
        console.log(`Vehicle ${vehicle.id} status updated to 'in_ride', now hidden from map`);

        // 5.3.3. Отмена активной брони (status = 'used')
        validationResponse.booking.status = BookingStatus.USED;
        await bookingRepository.save(validationResponse.booking);
      }

      // 5.4. Запуск мониторинга: lat/lng, battery, duration, cost
      // 5.4.1. Запуск фонового job'а: trackRide(ride_id)
      try {
        await RideTrackingService.startTracking(savedRide.id);
        console.log(`Ride tracking started for ride ${savedRide.id}`);
      } catch (trackingError) {
        console.error(`Failed to start tracking for ride ${savedRide.id}:`, trackingError);
        // Обработка ошибки запуска трекинга, возможно отправка уведомления
      }

      return res.status(201).json({
        message: 'Ride started successfully',
        ride: {
          id: savedRide.id,
          status: savedRide.status,
          start_time: savedRide.start_time,
          vehicle_id: savedRide.vehicle.id,
          booking_id: savedRide.booking.id
        },
        subscription_info: {
          has_subscription: subscriptionCheck.hasSubscription,
          free_minutes_used: subscriptionCheck.usedMinutes,
          free_minutes_remaining: subscriptionCheck.remainingMinutes
        }
      });
    } catch (error) {
      console.error('Error starting ride:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // 6.2.1. Логика: базовая ставка + время
  // 6.2.2. Учёт льгот по подписке (беспл. минуты)
  static async calculateRideCost = async (rideId: string): Promise<number> => {
    try {
      const rideRepository = getRepository(Ride);
      const userRepository = getRepository(User);
      const subscriptionRepository = getRepository(Subscription);
      const tariffPlanRepository = getRepository(TariffPlan);
      const vehicleRepository = getRepository(Vehicle);

      const ride = await rideRepository.findOne({
        where: { id: rideId },
        relations: ['user', 'vehicle']
      });

      if (!ride || !ride.end_time) {
        throw new Error('Ride not found or not completed');
      }

      // Находим транспорт, чтобы получить цену в минуту
      const vehicle = ride.vehicle || await vehicleRepository.findOne({ where: { id: ride.vehicle_id } });
      if (!vehicle) {
        throw new Error('Vehicle not found for ride');
      }

      // Вычисляем продолжительность поездки в минутах
      const durationInMinutes = (ride.end_time.getTime() - ride.start_time.getTime()) / (1000 * 60);

      // Проверяем, есть ли у пользователя активная подписка
      const userSubscriptions = await subscriptionRepository.find({
        where: {
          user_id: ride.user_id,
          status: 'active', // Предполагается, что это значение для активной подписки
          start_date: () => '<= NOW()',
          end_date: () => '>= NOW()'
        },
        relations: ['tariff_plan']
      });

      let totalCost = 0;
      let usedMinutes = durationInMinutes;

      if (userSubscriptions && userSubscriptions.length > 0) {
        // Пользователь имеет активную подписку
        const activeSubscription = userSubscriptions[0]; // Предполагаем, что только одна активная подписка
        const tariffPlan = activeSubscription.tariff_plan;

        // 6.2.2. Учет льгот по подписке (беспл. минуты)
        const remainingFreeMinutes = Math.max(0, tariffPlan.free_minutes - activeSubscription.used_minutes);

        if (remainingFreeMinutes > 0) {
          // Сначала используем бесплатные минуты
          const minutesToDeductFromFree = Math.min(usedMinutes, remainingFreeMinutes);
          usedMinutes -= minutesToDeductFromFree;

          // Обновляем количество использованных минут в подписке
          activeSubscription.used_minutes += minutesToDeductFromFree;
          await subscriptionRepository.save(activeSubscription);
        }

        // Расчет стоимости за оставшиеся минуты (вне бесплатного лимита)
        if (usedMinutes > 0) {
          // Используем цену тарифного плана за минуту
          // В нашем случае vehicle.price_per_minute - это цена за минуту для транспорта
          totalCost = usedMinutes * Number(vehicle.price_per_minute);
        }
        // Если использованы только бесплатные минуты, то totalCost останется 0
      } else {
        // 6.2.1. Логика: базовая ставка + время (без подписки)
        // Используем цену транспорта за минуту
        totalCost = durationInMinutes * Number(vehicle.price_per_minute);
      }

      // 6.2.3. Округление до рубля (по ТЗ)
      totalCost = Math.ceil(totalCost); // Округление вверх до рубля

      console.log(`Calculated ride cost for ride ${rideId}: ${totalCost} RUB (duration: ${durationInMinutes} min, used free minutes: ${durationInMinutes - usedMinutes})`);

      return totalCost;
    } catch (error) {
      console.error(`Error calculating ride cost for ride ${rideId}:`, error);
      throw error;
    }
  };

  // 6.3.1. SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'
  // 6.3.2. Проверка остатка бесплатных минут
  // 6.3.3. Обновление used_minutes += duration
  static async checkUserSubscription(userId: string) {
    try {
      const subscriptionRepository = getRepository(Subscription);

      // Ищем активные подписки пользователя
      const activeSubscriptions = await subscriptionRepository.find({
        where: {
          user_id: userId,
          status: SubscriptionStatus.ACTIVE,
          start_date: () => '<= NOW()',
          end_date: () => '>= NOW()',
        },
        relations: ['tariff_plan']
      });

      if (activeSubscriptions.length === 0) {
        // Пользователь не имеет активных подписок
        return {
          isEligible: true, // разрешаем поездку, но без льгот
          hasSubscription: false,
          usedMinutes: 0,
          remainingMinutes: 0,
          details: 'No active subscription - ride will be charged at standard rate'
        };
      }

      // Используем первую активную подписку (предполагаем, что у пользователя только одна активная подписка)
      const subscription = activeSubscriptions[0];
      const tariffPlan = subscription.tariff_plan;

      // Проверяем, есть ли еще доступные бесплатные минуты
      const remainingFreeMinutes = Math.max(0, tariffPlan.free_minutes - subscription.used_minutes);

      // 6.3.2. Проверка остатка бесплатных минут
      return {
        isEligible: true, // пользователь может начать поездку
        hasSubscription: true,
        usedMinutes: subscription.used_minutes,
        remainingMinutes: remainingFreeMinutes,
        details: `Active subscription with ${remainingFreeMinutes} free minutes remaining`
      };
    } catch (error) {
      console.error(`Error checking user subscription for user ${userId}:`, error);
      return {
        isEligible: false,
        hasSubscription: false,
        usedMinutes: 0,
        remainingMinutes: 0,
        details: 'Error checking subscription status'
      };
    }
  }

  // Метод для обновления статуса транспорта
  // 5.3.1. UPDATE vehicles SET status = 'in_ride'
  static async updateVehicleStatus = async (vehicle_id: string, new_status: string): Promise<boolean> => {
    try {
      const vehicleRepository = getRepository(Vehicle);
      const vehicle = await vehicleRepository.findOne({ where: { id: vehicle_id } });

      if (!vehicle) {
        console.error(`Vehicle with id ${vehicle_id} not found`);
        return false;
      }

      // Сохраняем старый статус для логирования
      const old_status = vehicle.status;
      vehicle.status = new_status as any; // Приведение к типу, т.к. статус может быть разным

      await vehicleRepository.save(vehicle);

      // 5.3.2. Скрытие транспорта с карты (публикация события)
      console.log(`Vehicle ${vehicle_id} status updated from '${old_status}' to '${new_status}'`);

      return true;
    } catch (error) {
      console.error(`Error updating vehicle status for vehicle ${vehicle_id}:`, error);
      return false;
    }
  };

  // 7.1.1. Валидация: ride_id, user_id
  static async validateRideForFinish = async (req: Request, res: Response): Promise<{isValid: boolean, ride?: Ride, userId?: string} | null> => {
    try {
      const { id } = req.params;
      const user_id = (req as any).user?.id;

      if (!id) {
        res.status(400).json({ error: 'Ride ID is required' });
        return null;
      }

      if (!user_id) {
        res.status(401).json({ error: 'User not authenticated' });
        return null;
      }

      const rideRepository = getRepository(Ride);
      const ride = await rideRepository.findOne({
        where: {
          id: id,
          user_id: user_id
        },
        relations: ['vehicle']
      });

      if (!ride) {
        res.status(404).json({
          error: 'Ride not found',
          details: 'Ride does not exist or does not belong to the user'
        });
        return null;
      }

      // Проверка, что поездка еще в процессе
      if (ride.status !== RideStatus.IN_PROGRESS) {
        res.status(400).json({
          error: 'Ride is not in progress',
          status: ride.status,
          details: 'Cannot finish a ride that is not in progress'
        });
        return null;
      }

      return {
        isValid: true,
        ride: ride,
        userId: user_id
      };
    } catch (error) {
      console.error('Error validating ride for finish:', error);
      res.status(500).json({ error: 'Internal server error' });
      return null;
    }
  };

  // 7.1. PUT /rides/:id/finish - завершение поездки
  static async finishRide = async (req: Request, res: Response): Promise<Response> => {
    try {
      // 7.1.1. Валидация: ride_id, user_id
      const validation = await RideController.validateRideForFinish(req, res);

      // Если валидация не пройдена, ответ уже отправлен
      if (!validation || !validation.isValid) {
        return res; // Ответ уже отправлен валидацией
      }

      const { ride, userId } = validation;

      // 7.1.2. Обновление rides.status = 'completed'
      ride.status = RideStatus.COMPLETED;
      ride.end_time = new Date();

      // 7.1.4. Сохранение итоговой стоимости
      try {
        ride.total_cost = await RideController.calculateRideCost(ride.id);
        console.log(`Ride ${ride.id} total cost calculated: ${ride.total_cost} RUB`);
      } catch (costError) {
        console.error(`Failed to calculate ride cost for ride ${ride.id}:`, costError);
        return res.status(500).json({ error: 'Failed to calculate ride cost' });
      }

      const rideRepository = getRepository(Ride);
      const updatedRide = await rideRepository.save(ride);

      // 7.1.3. Обновление vehicles.status = 'available'
      if (ride.vehicle) {
        const vehicleRepository = getRepository(Vehicle);
        const vehicle = ride.vehicle; // Уже загружен через relations
        vehicle.status = 'available';
        await vehicleRepository.save(vehicle);

        console.log(`Vehicle ${vehicle.id} status updated to 'available' after ride completion`);
      }

      return res.status(200).json({
        message: 'Ride finished successfully',
        ride: {
          id: updatedRide.id,
          status: updatedRide.status,
          start_time: updatedRide.start_time,
          end_time: updatedRide.end_time,
          total_cost: updatedRide.total_cost,
          vehicle_id: updatedRide.vehicle_id,
          user_id: updatedRide.user_id
        }
      });
    } catch (error) {
      console.error('Error finishing ride:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Метод для валидации брони
  static async validateBookingForRide(booking_id: string, user_id: string) {
    const bookingRepository = getRepository(Booking);
    const booking = await bookingRepository.findOne({
      where: {
        id: booking_id,
        user_id: user_id,
        status: BookingStatus.ACTIVE,
      },
      relations: ['vehicle'] // Включаем информацию о транспорте
    });

    // 5.2.2. Обработка «бронь отменена» / «истекла»
    if (!booking) {
      return {
        isValid: false,
        statusCode: 400,
        message: 'Booking not found or inactive',
        details: 'Either the booking does not exist, is not active, or does not belong to the user'
      };
    }

    // Проверка истечения срока бронирования
    const currentTime = new Date();
    if (booking.end_time < currentTime) {
      return {
        isValid: false,
        statusCode: 400,
        message: 'Booking expired',
        details: `Booking expired at ${booking.end_time}`
      };
    }

    // 5.2.3. Логгирование попыток старта без брони (или валидных)
    console.log(`Ride start validation passed for user ${user_id}, booking ${booking_id}`);

    return {
      isValid: true,
      booking: booking,
      booking_id: booking.id,
      vehicle_id: booking.vehicle.id
    };
  }
}