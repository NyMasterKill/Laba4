import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    gosuslugi_id: string;
  };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Сначала пробуем получить токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Если в заголовке нет, пробуем получить из cookie
      token = req.cookies?.accessToken || req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Access token is missing' });
    }

    // Проверяем токен
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default_secret_key'
      ) as { userId: string };

      // Находим пользователя по ID
      const userService = new UserService();
      const user = await userService.findByGosuslugiId(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Добавляем информацию о пользователе в объект запроса
      req.user = {
        id: user.id,
        gosuslugi_id: user.gosuslugi_id
      };

      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      
      // Если токен истёк, пробуем обновить его с помощью refresh токена
      if ((jwtError as jwt.JsonWebTokenError).name === 'TokenExpiredError') {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
          return res.status(401).json({ message: 'Refresh token is missing' });
        }

        try {
          const userService = new UserService();
          const userId = await userService.getUserIdByRefreshToken(refreshToken);

          if (!userId) {
            return res.status(401).json({ message: 'Invalid refresh token' });
          }

          // Генерируем новые токены
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
            await userService.generateTokens(userId);

          // Обновляем refresh токен в cookie
          res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
          });

          // Добавляем новый access токен в заголовки для последующего использования
          res.set('X-New-Access-Token', newAccessToken);

          // Повторно декодируем новый токен и добавляем пользователя в запрос
          const newDecoded = jwt.verify(
            newAccessToken,
            process.env.JWT_SECRET || 'default_secret_key'
          ) as { userId: string };

          const user = await userService.findByGosuslugiId(newDecoded.userId);

          if (!user) {
            return res.status(401).json({ message: 'User not found after refresh' });
          }

          req.user = {
            id: user.id,
            gosuslugi_id: user.gosuslugi_id
          };

          next();
        } catch (refreshError) {
          console.error('Refresh token error:', refreshError);
          return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }
      } else {
        return res.status(401).json({ message: 'Invalid access token' });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};