import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../src/config/typeorm.config';
import stationRoutes from '../src/routes/stationRoutes';

const app = express();
app.use(express.json());
app.use('/api', stationRoutes);

describe('Station Routes', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('GET /api/stations', () => {
    it('should return all active stations', async () => {
      const response = await request(app)
        .get('/api/stations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/stations/:id', () => {
    it('should return a specific station', async () => {
      const validStationId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/stations/${validStationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('lat');
      expect(response.body).toHaveProperty('lng');
    });

    it('should return 400 for invalid station ID', async () => {
      const invalidStationId = 'invalid-id';
      
      const response = await request(app)
        .get(`/api/stations/${invalidStationId}`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 404 for non-existant station', async () => {
      const validStationId = '123e4567-e89b-12d3-a456-426614174999'; // несуществующий ID
      
      const response = await request(app)
        .get(`/api/stations/${validStationId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Station not found');
    });
  });
});