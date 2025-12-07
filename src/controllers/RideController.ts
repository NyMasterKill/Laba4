import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Ride } from '../entities/Ride';
import { Booking } from '../entities/Booking';
import { Vehicle } from '../entities/Vehicle';
import { User } from '../entities/User';
import { Subscription } from '../entities/Subscription';
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

      // Валидация брони через отдельный метод для лучшей структуры
      const validationResponse = await RideController.validateBookingForRide(booking_id, user_id);
      if (!validationResponse.isValid) {
        return res.status(validationResponse.statusCode).json({ error: validationResponse.message });
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