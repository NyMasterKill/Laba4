import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../src/config/typeorm.config';
import vehicleRoutes from '../src/routes/vehicleRoutes';

const app = express();
app.use(express.json());
app.use('/api', vehicleRoutes);

describe('Vehicle Routes', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('GET /api/vehicles', () => {
    it('should return available vehicles', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return vehicles with filters', async () => {
      const response = await request(app)
        .get('/api/vehicles?status=available&lat=55.7558&lng=37.6173&radius=500')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/vehicles?lat=invalid_lat')
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('GET /api/stations/:stationId/vehicles', () => {
    it('should return vehicles at a specific station', async () => {
      const validStationId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .get(`/api/stations/${validStationId}/vehicles`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 400 for invalid station ID', async () => {
      const invalidStationId = 'invalid-id';
      
      const response = await request(app)
        .get(`/api/stations/${invalidStationId}/vehicles`)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });
});