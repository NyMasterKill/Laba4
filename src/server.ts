import express from 'express';
import { AppDataSource } from './config/typeorm.config';
import profileRoutes from './routes/profileRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import stationRoutes from './routes/stationRoutes';
import gosuslugiRoutes from './routes/gosuslugiRoutes';
import authRoutes from './routes/authRoutes';
import twoFactorAuthRoutes from './routes/twoFactorAuthRoutes';
import bookingRoutes from './routes/bookingRoutes'; // Импортируем маршруты бронирования
import rideRoutes from './routes/ride'; // Импортируем маршруты поездок
import paymentRoutes from './routes/payment'; // Импортируем маршруты оплаты
import tariffSubscriptionRoutes from './routes/tariffSubscription'; // Импортируем маршруты тарифов и подписок
import { BookingExpirationService } from './services/BookingExpirationService'; // Импорт сервиса

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
app.use('/api', authRoutes); // Добавляем маршруты для аутентификации
app.use('/api', twoFactorAuthRoutes); // Добавляем маршруты для 2FA
app.use('/api', bookingRoutes); // Добавляем маршруты для бронирования
app.use('/api', rideRoutes); // Добавляем маршруты для поездок
app.use('/api', paymentRoutes); // Добавляем маршруты для оплаты
app.use('/api', tariffSubscriptionRoutes); // Добавляем маршруты для тарифов и подписок

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

    // Start booking expiration service
    BookingExpirationService.start();

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