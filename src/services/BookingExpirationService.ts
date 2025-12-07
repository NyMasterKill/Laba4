import cron from 'node-cron';
import { AppDataSource } from '../config/typeorm.config';
import { Booking, BookingStatus } from '../entities/Booking';
import { Vehicle } from '../entities/Vehicle';
import { MoreThan, LessThanOrEqual } from 'typeorm';

export class BookingExpirationService {
  private static readonly CHECK_INTERVAL = '*/30 * * * * *'; // Каждые 30 секунд, для тестирования. В продакшене может быть раз в минуту или реже.

  static start() {
    console.log('Booking Expiration Service started.');
    // Планируем задачу
    cron.schedule(this.CHECK_INTERVAL, this.checkExpiredBookings.bind(this));
  }

  private static async checkExpiredBookings() {
    console.log('Checking for expired bookings...');
    const now = new Date();
    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Находим брони, статус которых ACTIVE и время окончания <= текущему времени
      const expiredBookings = await queryRunner.manager.find(Booking, {
        where: {
          status: BookingStatus.ACTIVE,
          end_time: LessThanOrEqual(now),
        },
        relations: ['vehicle', 'rides'], // Загружаем транспорт и поездки
      });

      for (const booking of expiredBookings) {
        // Проверяем, была ли начата поездка. Если да, бронь не отменяется.
        // Предположим, что если у брони есть rides со статусом, отличным от 'cancelled' или 'completed', то поездка начата.
        // Для упрощения, предположим, что если массив rides не пуст, то поездка начата.
        // В реальности статус поездки (Ride) будет важен.
        // Но в задаче 4.3 говорится про автоматическую отмену, если бронь истекла и поездка не начата.
        // Итак, проверим, есть ли у брони поездки.
        if (booking.rides && booking.rides.length > 0) {
            console.log(`Booking ${booking.id} has associated rides. Skipping expiration.`);
            continue; // Поездка уже начата или связана с бронью, не отменяем.
        }

        // Бронь истекла и поездка не начата.
        console.log(`Expiring booking ${booking.id} for vehicle ${booking.vehicle.id}`);
        booking.status = BookingStatus.EXPIRED;

        // Обновляем статус транспорта на 'available'
        const vehicle = booking.vehicle;
        vehicle.status = 'available';

        // Сохраняем изменения
        await queryRunner.manager.save(booking);
        await queryRunner.manager.save(vehicle);
      }

      await queryRunner.commitTransaction();
      console.log(`Checked and processed ${expiredBookings.length} expired bookings.`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error processing expired bookings:', error);
    } finally {
      await queryRunner.release();
    }
  }
}