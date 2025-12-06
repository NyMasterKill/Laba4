import { Repository } from 'typeorm';
import { Station } from '../entities/Station';
import { AppDataSource } from '../config/typeorm.config';

export class StationService {
  private stationRepository: Repository<Station>;

  constructor() {
    this.stationRepository = AppDataSource.getRepository(Station);
  }

  async getAllStations(): Promise<Station[]> {
    return await this.stationRepository.find({
      where: { is_active: true }
    });
  }

  async getStationById(id: string): Promise<Station | null> {
    return await this.stationRepository.findOne({
      where: { id, is_active: true }
    });
  }
}