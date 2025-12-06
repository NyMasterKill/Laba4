import { Repository } from 'typeorm';
import { Profile } from '../entities/Profile';
import { AppDataSource } from '../config/typeorm.config';

export class ProfileService {
  private profileRepository: Repository<Profile>;

  constructor() {
    this.profileRepository = AppDataSource.getRepository(Profile);
  }

  async getProfileByUserId(userId: string): Promise<Profile | null> {
    return await this.profileRepository.findOne({
      where: { user: { id: userId } }
    });
  }

  async updateProfile(userId: string, profileData: Partial<Profile>): Promise<Profile | null> {
    const profile = await this.getProfileByUserId(userId);
    
    if (!profile) {
      return null;
    }

    Object.assign(profile, profileData);
    return await this.profileRepository.save(profile);
  }
}