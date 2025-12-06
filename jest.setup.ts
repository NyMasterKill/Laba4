// jest.setup.ts
import { jest } from '@jest/globals';

// Глобальные настройки для тестов
process.env.JWT_SECRET = 'test_secret_for_jest';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_db';

// Мокаем TypeORM DataSource
jest.unstable_mockModule('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    DataSource: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn().mockResolvedValue(undefined),
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn(),
          find: jest.fn(),
          save: jest.fn(),
          create: jest.fn(),
        }),
      };
    }),
  };
});