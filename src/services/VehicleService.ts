import { Repository } from 'typeorm';
import { Vehicle } from '../entities/Vehicle';
import { AppDataSource } from '../config/typeorm.config';

export class VehicleService {
  private vehicleRepository: Repository<Vehicle>;

  constructor() {
    this.vehicleRepository = AppDataSource.getRepository(Vehicle);
  }

  async getAvailableVehicles(
    status?: string,
    lat?: number,
    lng?: number,
    radius?: number,
    type?: string // Добавлен параметр для фильтрации по типу
  ): Promise<Vehicle[]> {
    let query = this.vehicleRepository.createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.station', 'station')
      .where('vehicle.is_active = :isActive', { isActive: true });

    // Фильтрация по статусу
    if (status) {
      query = query.andWhere('vehicle.status = :status', { status });
    } else {
      // По умолчанию ищем доступные транспортные средства
      query = query.andWhere('vehicle.status = :status', { status: 'available' });
    }

    // Фильтрация по типу (велосипед, самокат)
    if (type) {
      query = query.andWhere('vehicle.type = :type', { type });
    }

    // Фильтрация по местоположению, если координаты и радиус указаны
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      // Рассчитываем дистанцию с помощью формулы гаверсинуса
      // Фильтрация происходит на уровне SQL для лучшей производительности
      query = query.andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) *
            cos(radians(vehicle.current_lat)) *
            cos(radians(vehicle.current_lng) - radians(:lng)) +
            sin(radians(:lat)) *
            sin(radians(vehicle.current_lat))
          )
        ) <= :radius`,
        { lat, lng, radius }
      );
    }

    // Ограничение на количество возвращаемых объектов (задача 3.2.4)
    query = query.limit(50);

    return await query.getMany();
  }

  async getVehiclesAtStation(stationId: string): Promise<Vehicle[]> {
    return await this.vehicleRepository.find({
      where: { station: { id: stationId } },
      relations: ['station']
    });
  }
}