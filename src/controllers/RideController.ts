import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Ride } from '../entities/Ride';
import { Booking } from '../entities/Booking';
import { Vehicle } from '../entities/Vehicle';
import { User } from '../entities/User';
import { BookingStatus, RideStatus } from '../entities/Booking';

export class RideController {
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

      // 5.2. Проверка: есть ли бронь у пользователя, не истёк ли срок
      const bookingRepository = getRepository(Booking);
      const booking = await bookingRepository.findOne({
        where: {
          id: booking_id,
          user_id: user_id,
          status: BookingStatus.ACTIVE,
          end_time: () => 'end_time > NOW()' // не истекла
        }
      });

      // 5.2.2. Обработка «бронь отменена» / «истекла»
      if (!booking) {
        return res.status(400).json({ 
          error: 'Booking not found or expired', 
          details: 'Either the booking does not exist, has expired, or does not belong to the user' 
        });
      }

      // 5.1.2. Проверка: бронь активна и не истекла (уже проверили выше)

      // 5.1.3. Создание записи в rides
      const rideRepository = getRepository(Ride);
      
      const newRide = new Ride();
      newRide.status = RideStatus.IN_PROGRESS;
      newRide.start_time = new Date();
      newRide.user = { id: user_id } as User;
      newRide.vehicle = booking.vehicle as Vehicle;
      newRide.booking = { id: booking_id } as Booking;
      
      // Устанавливаем начальные координаты из транспорта или станции
      // TODO: возможно, нужно получать текущие координаты транспорта в реальном времени
      if (booking.vehicle && booking.vehicle.current_lat && booking.vehicle.current_lng) {
        newRide.start_lat = booking.vehicle.current_lat;
        newRide.start_lng = booking.vehicle.current_lng;
      }

      const savedRide = await rideRepository.save(newRide);

      // 5.3. Обновление vehicle.status = in_ride, скрытие с карты
      const vehicleRepository = getRepository(Vehicle);
      const vehicle = await vehicleRepository.findOne({ where: { id: booking.vehicle_id } });
      
      if (vehicle) {
        vehicle.status = 'in_ride';
        await vehicleRepository.save(vehicle);
        
        // 5.3.3. Отмена активной брони (status = 'used')
        booking.status = BookingStatus.USED;
        await bookingRepository.save(booking);
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
}