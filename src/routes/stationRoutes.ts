import { Router } from 'express';
import { StationController } from '../controllers/StationController';

const router = Router();
const stationController = new StationController();

// GET /stations
router.get('/stations', (req, res) => stationController.getAllStations(req, res));

// GET /stations/:id
router.get('/stations/:id', (req, res) => stationController.getStationById(req, res));

// GET /stations/:stationId/vehicles (уже есть в vehicleRoutes)
// Реализация в StationController для переиспользования логики

export default router;