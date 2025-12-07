import { getRepository } from 'typeorm';
import { Ride } from '../entities/Ride';
import { Vehicle } from '../entities/Vehicle';
import { User } from '../entities/User';
import { RideStatus } from '../entities/Booking';

export class RideTrackingService {
  private static trackingJobs: Map<string, NodeJS.Timeout> = new Map();

  // 5.4.1. Запуск фонового job'а: trackRide(ride_id)
  static async startTracking(rideId: string): Promise<void> {
    // Проверяем, не запущен ли уже трекинг для этой поездки
    if (this.trackingJobs.has(rideId)) {
      console.log(`Tracking already started for ride ${rideId}`);
      return;
    }

    console.log(`Starting tracking for ride ${rideId}`);

    // Запускаем трекинг с интервалом 10 секунд
    const interval = setInterval(async () => {
      await this.trackRide(rideId);
    }, 10000); // 10 секунд

    // Сохраняем ссылку на интервал
    this.trackingJobs.set(rideId, interval);

    console.log(`Tracking started for ride ${rideId}`);
  }

  // Основная логика трекинга
  private static async trackRide(rideId: string): Promise<void> {
    try {
      const rideRepository = getRepository(Ride);
      const vehicleRepository = getRepository(Vehicle);

      const ride = await rideRepository.findOne({
        where: { id: rideId },
        relations: ['vehicle', 'user']
      });

      if (!ride) {
        console.error(`Ride with id ${rideId} not found, stopping tracking`);
        this.stopTracking(rideId);
        return;
      }

      // 5.4.2. Запись геопозиции каждые 10 сек (ride_tracks)
      // NOTE: В реальной системе здесь будет получение актуальных координат из GPS-данных
      // Пока что используем координаты из транспорта
      if (ride.vehicle) {
        // Получаем обновленные данные транспорта
        const updatedVehicle = await vehicleRepository.findOne({ 
          where: { id: ride.vehicle.id } 
        });

        if (updatedVehicle) {
          // 5.4.3. Расчёт стоимости в реальном времени
          const durationInMinutes = (new Date().getTime() - ride.start_time.getTime()) / (1000 * 60);
          const calculatedCost = durationInMinutes * Number(updatedVehicle.price_per_minute);

          // Обновляем данные в поездке
          ride.current_lat = updatedVehicle.current_lat;
          ride.current_lng = updatedVehicle.current_lng;
          ride.total_cost = calculatedCost;
          
          // Обновляем уровень заряда батареи
          ride.current_battery_level = updatedVehicle.battery_level;

          // Сохраняем обновленные данные поездки
          await rideRepository.save(ride);

          // 5.4.4. Отправка обновлений через SSE/WS
          // NOTE: Реализация SSE/WS будет зависеть от архитектуры WebSocket/SSE сервера
          // Пока что просто логируем отправку обновлений
          console.log(`Sending ride updates via SSE/WS for ride ${rideId}:`, {
            lat: updatedVehicle.current_lat,
            lng: updatedVehicle.current_lng,
            battery: updatedVehicle.battery_level,
            duration: durationInMinutes,
            cost: calculatedCost
          });
        }
      }
    } catch (error) {
      console.error(`Error tracking ride ${rideId}:`, error);
    }
  }

  // Метод для остановки трекинга
  static async stopTracking(rideId: string): Promise<void> {
    const interval = this.trackingJobs.get(rideId);
    if (interval) {
      clearInterval(interval);
      this.trackingJobs.delete(rideId);
      console.log(`Tracking stopped for ride ${rideId}`);
    }
  }

  // Метод для завершения поездки и остановки трекинга
  static async finishRide(rideId: string): Promise<boolean> {
    try {
      const rideRepository = getRepository(Ride);
      const ride = await rideRepository.findOne({ where: { id: rideId } });

      if (!ride) {
        console.error(`Ride with id ${rideId} not found`);
        return false;
      }

      // Устанавливаем статус завершения и время окончания
      ride.status = RideStatus.COMPLETED;
      ride.end_time = new Date();
      
      await rideRepository.save(ride);

      // Останавливаем трекинг
      this.stopTracking(rideId);

      return true;
    } catch (error) {
      console.error(`Error finishing ride ${rideId}:`, error);
      return false;
    }
  }
}