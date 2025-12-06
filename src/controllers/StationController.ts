import { Request, Response } from 'express';
import { StationService } from '../services/StationService';
import { VehicleService } from '../services/VehicleService';

export class StationController {
  private stationService: StationService;
  private vehicleService: VehicleService;

  constructor() {
    this.stationService = new StationService();
    this.vehicleService = new VehicleService();
  }

  async getAllStations(req: Request, res: Response): Promise<void> {
    try {
      const stations = await this.stationService.getAllStations();
      res.status(200).json(stations);
    } catch (error) {
      console.error('Error getting stations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getStationById(req: Request, res: Response): Promise<void> {
    try {
      // Валидация параметров уже выполнена в маршрутах
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'Station ID is required' });
        return;
      }

      const station = await this.stationService.getStationById(id);

      if (!station) {
        res.status(404).json({ message: 'Station not found' });
        return;
      }

      res.status(200).json(station);
    } catch (error) {
      console.error('Error getting station by ID:', error);
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