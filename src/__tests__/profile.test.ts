import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../src/config/typeorm.config';
import profileRoutes from '../src/routes/profileRoutes';
import { authMiddleware } from '../src/middleware/auth';

// Мокаем middleware аутентификации для тестов
jest.mock('../src/middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id' }; // Мокаем пользователя
    next();
  },
}));

// Мокаем сервисы
jest.mock('../src/services/ProfileService');

const app = express();
app.use(express.json());
app.use('/api', profileRoutes);

describe('Profile Routes', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(200);

      // Проверяем структуру ответа
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('first_name');
      expect(response.body).toHaveProperty('last_name');
    });
  });

  describe('PATCH /api/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
      };

      const response = await request(app)
        .patch('/api/profile')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('first_name', 'Updated');
      expect(response.body).toHaveProperty('last_name', 'Name');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        first_name: '',  // Пустое имя, должно вызвать ошибку валидации
        birth_date: 'invalid-date',
      };

      const response = await request(app)
        .patch('/api/profile')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });
});