import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';
import { UserSession } from '../entities/UserSession';
import { MoreThanOrEqual } from 'typeorm';

// Тип для расширения Request
export interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Извлекаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    // Проверка, не истек ли токен (если токен истек, jwt.verify выбросит ошибку)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string, exp: number };

    // Проверяем, что токен не был "отозван" (если в приложении реализована такая функция)
    // В простом случае просто проверяем время истечения
    const now = Math.floor(Date.now() / 1000); // текущее время в секундах
    if (decoded.exp < now) {
      return res.status(401).json({ message: 'Token has expired' });
    }

    // Находим пользователя по ID
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Добавляем пользователя в объект запроса
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const refreshTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Извлекаем refresh токен из cookies или заголовка
    const refreshToken = req.cookies?.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    // Проверяем, не истек ли refresh токен
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key') as { userId: string };
    } catch (error) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Находим сессию по refresh токену в БД
    const sessionRepository = getRepository(UserSession);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12); // ОШИБКА: тут должен быть bcrypt.compare
    
    // НО! Это неправильно - мы не можем сравнить хэш с токеном, не зная исходного токена
    // Нам нужно переписать логику: хранить refresh токен в виде "токен_id" и хранить хэш в БД
    // Для этого нужно обновить UserSession сущность
    
    const now = new Date();
    const session = await sessionRepository.findOne({
      where: {
        user: { id: decoded.userId },
        is_active: true,
        expires_at: MoreThanOrEqual(now)
      }
    });

    if (!session) {
      return res.status(401).json({ message: 'Session not found or inactive' });
    }

    // Сравниваем предоставленный токен с хранящимся в БД (нужно реализовать через bcrypt.compare)
    const tokenValid = await bcrypt.compare(refreshToken, session.refresh_token_hash);
    if (!tokenValid) {
      // Если токен недействителен, удаляем сессию
      await sessionRepository.remove(session);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Добавляем информацию о сессии в запрос
    (req as AuthRequest).user = await getRepository(User).findOne({ where: { id: decoded.userId } });
    next();
  } catch (error) {
    console.error('Refresh token validation error:', error);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};