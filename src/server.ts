import express from 'express';
import { AppDataSource } from './config/typeorm.config';
import profileRoutes from './routes/profileRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import stationRoutes from './routes/stationRoutes';
import gosuslugiRoutes from './routes/gosuslugiRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies for refresh tokens
app.use(require('cookie-parser')());

// Routes
app.use('/api', profileRoutes);
app.use('/api', vehicleRoutes); // Добавляем маршруты для транспортных средств
app.use('/api', stationRoutes); // Добавляем маршруты для станций
app.use('/api', gosuslugiRoutes); // Добавляем маршруты для интеграции с Госуслугами

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Data source has been initialized!');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error during data source initialization:', err);
  }
};

startServer();

export default app;