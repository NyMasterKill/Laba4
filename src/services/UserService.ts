import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../entities/User';
import { Profile } from '../entities/Profile';
import { GosuslugiBinding } from '../entities/GosuslugiBinding';
import { UserSession } from '../entities/UserSession';
import { AppDataSource } from '../config/typeorm.config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface CreateUserWithProfileAndBindingData {
  gosuslugiId: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: string;
  passportNumber?: string;
}

export class UserService {
  private userRepository: Repository<User>;
  private profileRepository: Repository<Profile>;
  private gosuslugiBindingRepository: Repository<GosuslugiBinding>;
  private userSessionRepository: Repository<UserSession>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.profileRepository = AppDataSource.getRepository(Profile);
    this.gosuslugiBindingRepository = AppDataSource.getRepository(GosuslugiBinding);
    this.userSessionRepository = AppDataSource.getRepository(UserSession);
  }

  async findByGosuslugiId(gosuslugiId: string): Promise<User | null> {
    const binding = await this.gosuslugiBindingRepository.findOne({
      where: { gosuslugi_id: gosuslugiId },
      relations: ['user', 'user.profile', 'user.sessions']
    });

    return binding ? binding.user : null;
  }

  async createUserWithProfileAndBinding(userData: CreateUserWithProfileAndBindingData): Promise<User> {
    const user = new User();
    user.gosuslugi_id = userData.gosuslugiId;
    user.phone = userData.phone || null;
    user.is_active = true;

    // Сохраняем пользователя
    const savedUser = await this.userRepository.save(user);

    // Создаем и сохраняем профиль
    const profile = new Profile();
    profile.first_name = userData.firstName;
    profile.last_name = userData.lastName;
    profile.middle_name = userData.middleName || null;
    profile.birth_date = userData.birthDate ? new Date(userData.birthDate) : new Date(); // временно дата рождения по умолчанию
    profile.passport_number = userData.passportNumber || '';
    profile.user = savedUser;

    const savedProfile = await this.profileRepository.save(profile);

    // Создаем и сохраняем привязку к Госуслугам
    const binding = new GosuslugiBinding();
    binding.gosuslugi_id = userData.gosuslugiId;
    binding.external_user_id = userData.gosuslugiId; // в реальной системе это может отличаться
    binding.email = userData.email || null;
    binding.phone = userData.phone || null;
    binding.is_verified = true; // поскольку это из Госуслуг, считаем верифицированным
    binding.user = savedUser;

    await this.gosuslugiBindingRepository.save(binding);

    // Обновляем пользователя, чтобы включить профиль
    savedUser.profile = savedProfile;
    return savedUser;
  }

  async updateGosuslugiBinding(userId: string, updateData: Partial<GosuslugiBinding>): Promise<GosuslugiBinding | null> {
    const binding = await this.gosuslugiBindingRepository.findOne({
      where: { user: { id: userId } }
    });

    if (!binding) {
      return null;
    }

    Object.assign(binding, updateData);
    return await this.gosuslugiBindingRepository.save(binding);
  }

  async generateTokens(userId: string): Promise<{ accessToken: string, refreshToken: string }> {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '15m' } // 15 минут для доступа
    );

    // Генерируем refresh токен
    const refreshTokenRaw = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key',
      { expiresIn: '7d' } // 7 дней для обновления
    );

    // Хэшируем refresh токен для хранения в базе
    const refreshTokenHash = await bcrypt.hash(refreshTokenRaw, 12);

    // Создаем запись сессии
    const session = new UserSession();
    session.refresh_token_hash = refreshTokenHash;
    session.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
    session.user = { id: userId } as User; // используем только ID для связи

    await this.userSessionRepository.save(session);

    return { accessToken, refreshToken: refreshTokenRaw };
  }

  async getUserIdByRefreshToken(refreshToken: string): Promise<string | null> {
    try {
      // Декодируем токен, чтобы получить userId
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key'
      ) as { userId: string };

      // Находим сессию по хэшированному токену
      const session = await this.verifyRefreshTokenInDB(refreshToken);

      if (!session || !session.is_active) {
        return null;
      }

      return decoded.userId;
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      return null;
    }
  }

  private async verifyRefreshTokenInDB(refreshToken: string): Promise<UserSession | null> {
    try {
      // Хэшируем полученный токен
      const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

      // Находим сессию по хэшированному токену
      const now = new Date();
      const session = await this.userSessionRepository.findOne({
        where: {
          refresh_token_hash: refreshTokenHash,
          is_active: true,
          expires_at: MoreThanOrEqual(now)
        },
        relations: ['user']
      });

      return session;
    } catch (error) {
      console.error('Error checking refresh token in DB:', error);
      return null;
    }
  }

  async invalidateRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      // Находим сессию по хэшированному токену
      const session = await this.verifyRefreshTokenInDB(refreshToken);

      if (!session) {
        return false;
      }

      // Деактивируем сессию
      session.is_active = false;
      await this.userSessionRepository.save(session);

      return true;
    } catch (error) {
      console.error('Error invalidating refresh token:', error);
      return false;
    }
  }
}