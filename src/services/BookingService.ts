import { Repository, In, MoreThan } from 'typeorm';
import { Booking, BookingStatus } from '../entities/Booking';
import { User } from '../entities/User';
import { Vehicle } from '../entities/Vehicle';
import { AppDataSource } from '../config/typeorm.config';
import { BadRequestError, ConflictError, NotFoundError } from 'routing-controllers';

export class BookingService {
  private bookingRepository: Repository<Booking>;
  private userRepository: Repository<User>;
  private vehicleRepository: Repository<Vehicle>;

  constructor() {
    this.bookingRepository = AppDataSource.getRepository(Booking);
    this.userRepository = AppDataSource.getRepository(User);
    this.vehicleRepository = AppDataSource.getRepository(Vehicle);
  }

  async createBooking(userId: string, vehicleId: string): Promise<Booking> {
    // 1. Найти пользователя
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Проверка кулдауна (5 минут)
    if (user.last_booking_ended_at) {
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      if (user.last_booking_ended_at > fiveMinutesAgo) {
        throw new ConflictError('Please wait for the cooldown period to end.');
      }
    }

    // 2. Найти транспорт
    const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // 3. Проверить, что транспорт доступен
    if (vehicle.status !== 'available') {
      throw new BadRequestError('Vehicle is not available');
    }

    // 4. Проверить, что у пользователя нет активной брони
    const now = new Date();
    const activeBooking = await this.bookingRepository.findOne({
      where: {
        user: { id: userId },
        status: BookingStatus.ACTIVE,
        end_time: MoreThan(now), // Не истекшая
      },
    });

    if (activeBooking) {
      throw new BadRequestError('User already has an active booking');
    }

    // 5. Создать бронь
    const booking = new Booking();
    booking.user = user;
    booking.vehicle = vehicle;
    booking.status = BookingStatus.ACTIVE;
    booking.start_time = new Date(); // Время создания брони
    // Установим время истечения, например, +15 минут
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 15);
    booking.end_time = expiryTime;

    // 6. Сохранить бронь
    // Выполняем в транзакции, чтобы избежать race condition
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Сначала обновляем статус транспорта
      vehicle.status = 'reserved';
      await queryRunner.manager.save(vehicle);

      // Затем создаём и сохраняем бронь
      const savedBooking = await queryRunner.manager.save(booking);

      await queryRunner.commitTransaction();
      return savedBooking;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // Пробрасываем ошибку дальше
    } finally {
      await queryRunner.release();
    }
  }
}