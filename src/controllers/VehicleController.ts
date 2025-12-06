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
      const { status, lat, lng, radius } = req.query;

      // Преобразуем параметры в нужные типы
      const statusStr = typeof status === 'string' ? status : undefined;
      const latNum = lat !== undefined ? parseFloat(lat as string) : undefined;
      const lngNum = lng !== undefined ? parseFloat(lng as string) : undefined;
      const radiusNum = radius !== undefined ? parseFloat(radius as string) : undefined;

      // Вызываем сервис для получения транспортных средств
      const vehicles = await this.vehicleService.getAvailableVehicles(
        statusStr,
        latNum,
        lngNum,
        radiusNum
      );

      res.status(200).json(vehicles);
    } catch (error) {
      console.error('Error getting vehicles:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getVehiclesAtStation(req: Request, res: Response): Promise<void> {
    try {
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