import { Request, Response } from 'express';
import { GosuslugiService } from '../services/GosuslugiService';
import { UserService } from '../services/UserService';

export class AuthController {
  private gosuslugiService: GosuslugiService;
  private userService: UserService;

  constructor() {
    this.gosuslugiService = new GosuslugiService();
    this.userService = new UserService();
  }

  // Эндпоинт для проверки сессии при старте приложения
  async checkSession(req: Request, res: Response): Promise<void> {
    try {
      // Проверяем наличие токена в заголовке или в cookie
      const authHeader = req.headers.authorization;
      let token = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        // Если в заголовке нет, пробуем получить из cookie
        token = req.cookies?.accessToken || req.cookies?.token;
      }

      if (!token) {
        res.status(401).json({ authenticated: false, message: 'No token provided' });
        return;
      }

      // Проверяем токен
      try {
        const decoded = this.userService.verifyToken(token);
        if (!decoded) {
          res.status(401).json({ authenticated: false, message: 'Invalid token' });
          return;
        }

        // Находим пользователя по ID
        const user = await this.userService.findByGosuslugiId(decoded.userId);

        if (!user) {
          res.status(401).json({ authenticated: false, message: 'User not found' });
          return;
        }

        // Возвращаем информацию о пользователе
        res.status(200).json({
          authenticated: true,
          user: {
            id: user.id,
            gosuslugi_id: user.gosuslugi_id,
            phone: user.phone,
            is_active: user.is_active,
            profile: user.profile ? {
              first_name: user.profile.first_name,
              last_name: user.profile.last_name,
              middle_name: user.profile.middle_name,
              birth_date: user.profile.birth_date,
              passport_number: user.profile.passport_number
            } : null
          }
        });
      } catch (error) {
        console.error('Token verification error:', error);
        
        // Если токен истёк, пробуем обновить его с помощью refresh токена
        if ((error as Error).name === 'TokenExpiredError') {
          const refreshToken = req.cookies?.refreshToken;

          if (!refreshToken) {
            res.status(401).json({ authenticated: false, message: 'Refresh token is missing' });
            return;
          }

          const userId = await this.userService.getUserIdByRefreshToken(refreshToken);

          if (!userId) {
            res.status(401).json({ authenticated: false, message: 'Invalid refresh token' });
            return;
          }

          // Генерируем новые токены
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
            await this.userService.generateTokens(userId);

          // Обновляем refresh токен в cookie
          res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
          });

          // Возвращаем новую информацию сессии
          const updatedUser = await this.userService.findByGosuslugiId(userId);

          res.status(200).json({
            authenticated: true,
            accessToken: newAccessToken,
            user: {
              id: updatedUser?.id,
              gosuslugi_id: updatedUser?.gosuslugi_id,
              phone: updatedUser?.phone,
              is_active: updatedUser?.is_active,
              profile: updatedUser?.profile ? {
                first_name: updatedUser.profile.first_name,
                last_name: updatedUser.profile.last_name,
                middle_name: updatedUser.profile.middle_name,
                birth_date: updatedUser.profile.birth_date,
                passport_number: updatedUser.profile.passport_number
              } : null
            }
          });
        } else {
          res.status(401).json({ authenticated: false, message: 'Invalid token' });
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      res.status(500).json({ authenticated: false, message: 'Session check failed' });
    }
  }

  // Эндпоинт для выхода из системы
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        // Деактивируем refresh токен
        await this.userService.invalidateRefreshToken(refreshToken);
      }

      // Удаляем токены из cookie
      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  }

  // Вспомогательный метод для проверки токена
  private verifyToken(token: string) {
    try {
      const decoded = require('jsonwebtoken').verify(
        token,
        process.env.JWT_SECRET || 'default_secret_key'
      ) as { userId: string };

      return decoded;
    } catch (error) {
      return null;
    }
  }
}