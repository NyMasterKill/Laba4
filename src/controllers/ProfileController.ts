import { Request, Response } from 'express';
import { ProfileService } from '../services/ProfileService';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  async getCurrentUserProfile(req: Request, res: Response): Promise<void> {
    try {
      // Получаем пользователя из JWT (предполагается, что middleware добавляет его в req.user)
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const profile = await this.profileService.getProfileByUserId(userId);

      if (!profile) {
        res.status(404).json({ message: 'Profile not found' });
        return;
      }

      res.status(200).json(profile);
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const profile = await this.profileService.updateProfile(userId, req.body);

      if (!profile) {
        res.status(404).json({ message: 'Profile not found' });
        return;
      }

      res.status(200).json(profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}