import { Request, Response } from 'express';
import { VehicleService } from '../services/VehicleService';

export class VehicleController {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  async getVehiclesWithFilters(req: Request, res: Response): Promise<void> {
    try {
      // Получаем параметры из запроса
      const { status, lat, lng, radius, type } = req.query;

      // Преобразуем параметры в нужные типы и валидируем
      const statusStr = typeof status === 'string' ? status : undefined;
      const typeStr = typeof type === 'string' ? type : undefined;

      let latNum: number | undefined;
      let lngNum: number | undefined;
      let radiusNum: number | undefined;

      if (typeof lat === 'string') {
        latNum = parseFloat(lat);
        if (isNaN(latNum) || latNum < -90 || latNum > 90) {
          res.status(400).json({ message: 'Invalid latitude. Must be a number between -90 and 90.' });
          return;
        }
      }
      if (typeof lng === 'string') {
        lngNum = parseFloat(lng);
        if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
          res.status(400).json({ message: 'Invalid longitude. Must be a number between -180 and 180.' });
          return;
        }
      }
      if (typeof radius === 'string') {
        radiusNum = parseFloat(radius);
        if (isNaN(radiusNum) || radiusNum <= 0) {
          res.status(400).json({ message: 'Invalid radius. Must be a positive number.' });
          return;
        }
      }

      // Проверка валидности типа транспорта (если передан)
      if (typeStr && !['bicycle', 'scooter'].includes(typeStr)) {
         res.status(400).json({ message: 'Invalid vehicle type. Supported types: bicycle, scooter.' });
         return;
      }

      // Вызываем сервис для получения транспортных средств
      const vehicles = await this.vehicleService.getAvailableVehicles(
        statusStr,
        latNum,
        lngNum,
        radiusNum,
        typeStr // Передаём type в сервис
      );

      res.status(200).json(vehicles);
    } catch (error) {
      console.error('Error getting vehicles:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getVehiclesAtStation(req: Request, res: Response): Promise<void> {
    try {
      // Валидация параметров уже выполнена в маршрутах
      const { stationId } = req.params;

      if (!stationId) {
        res.status(400).json({ message: 'Station ID is required' });
        return;
      }

      const vehicles = await this.vehicleService.getVehiclesAtStation(stationId);
      res.status(200).json(vehicles);
    } catch (error) {
      console.error('Error getting vehicles at station:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}