import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { validateQuery } from '../middleware/validation';
import { getVehiclesFilterSchema } from '../types/validationSchemas';

const router = Router();
const vehicleController = new VehicleController();

// GET /vehicles?status=available&lat=...&lng=...&radius=500
router.get('/vehicles', validateQuery(getVehiclesFilterSchema), (req, res) => vehicleController.getVehiclesWithFilters(req, res));

// GET /stations/:stationId/vehicles
router.get('/stations/:stationId/vehicles', (req, res) => vehicleController.getVehiclesAtStation(req, res));

export default router;