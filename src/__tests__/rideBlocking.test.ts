import request from 'supertest';
import { Connection, createConnection, getConnection } from 'typeorm';
import { Ride } from '../entities/Ride';
import { User } from '../entities/User';
import { Vehicle } from '../entities/Vehicle';
import { Fine, FineStatus, FineType } from '../entities/Fine';
import { Booking } from '../entities/Booking';
import { BookingStatus } from '../entities/Booking';
import { app } from '../server'; // assuming your Express app is exported as 'app' from server.ts

describe('Ride Blocking due to Unpaid Fines API', () => {
  let connection: Connection;
  let token: string;
  let userId: string;
  let vehicleId: string;
  let bookingId: string;

  beforeAll(async () => {
    connection = await createConnection();
  });

  afterAll(async () => {
    await getConnection().close();
  });

  beforeEach(async () => {
    // Create a test user
    const user = new User();
    user.email = 'test@example.com';
    user.password = 'hashed_password';
    user.phone = '+79991234567';
    await connection.getRepository(User).save(user);
    userId = user.id;

    // Create a test vehicle
    const vehicle = new Vehicle();
    vehicle.type = 'scooter';
    vehicle.model = 'Test Model';
    vehicle.status = 'available';
    vehicle.price_per_minute = 10;
    vehicle.current_lat = 55.7558;
    vehicle.current_lng = 37.6173;
    await connection.getRepository(Vehicle).save(vehicle);
    vehicleId = vehicle.id;

    // Create a test booking for the user
    const booking = new Booking();
    booking.user = user;
    booking.vehicle = vehicle;
    booking.status = BookingStatus.ACTIVE;
    booking.start_time = new Date();
    const futureTime = new Date();
    futureTime.setMinutes(futureTime.getMinutes() + 15); // 15 minutes from now
    booking.end_time = futureTime;
    await connection.getRepository(Booking).save(booking);
    bookingId = booking.id;

    // Generate a test token (this might vary depending on your auth implementation)
    token = 'test_token'; // Replace with actual token generation
  });

  afterEach(async () => {
    await connection.getRepository(Ride).delete({});
    await connection.getRepository(Booking).delete({});
    await connection.getRepository(Vehicle).delete({});
    await connection.getRepository(User).delete({});
    await connection.getRepository(Fine).delete({});
  });

  describe('POST /rides/start with unpaid fines check', () => {
    it('should block ride start when user has unpaid fines', async () => {
      // Create an unpaid fine for the user
      const fine = new Fine();
      fine.type = FineType.STATION_RETURN_VIOLATION;
      fine.amount = 1000;
      fine.status = FineStatus.PENDING;
      fine.description = 'Late return fine';
      fine.user_id = userId;
      await connection.getRepository(Fine).save(fine);

      // Try to start a ride - should be blocked
      const response = await request(app)
        .post('/rides/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ booking_id: bookingId })
        .expect(403);

      expect(response.body.error).toBe('User has unpaid fines');
      expect(response.body.details).toBe('Cannot start a new ride until fines are paid');
      expect(response.body.unpaid_fine).toBeDefined();
      expect(response.body.unpaid_fine.id).toBe(fine.id);
      expect(response.body.unpaid_fine.amount).toBe(1000);
      expect(response.body.unpaid_fine.status).toBeUndefined(); // Should not expose sensitive information
    });

    it('should allow ride start when user has no unpaid fines', async () => {
      // Ensure user has no unpaid fines
      const fines = await connection.getRepository(Fine).find({
        where: { user_id: userId }
      });
      expect(fines.length).toBe(0);

      // Try to start a ride - should be allowed
      const response = await request(app)
        .post('/rides/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ booking_id: bookingId })
        .expect(201);

      expect(response.body.message).toBe('Ride started successfully');
      expect(response.body.ride).toBeDefined();
      expect(response.body.ride.status).toBe('in_progress');
    });

    it('should allow ride start when user has only paid fines', async () => {
      // Create a paid fine for the user
      const paidFine = new Fine();
      paidFine.type = FineType.STATION_RETURN_VIOLATION;
      paidFine.amount = 1000;
      paidFine.status = FineStatus.PAID;
      paidFine.description = 'Paid violation fine';
      paidFine.user_id = userId;
      await connection.getRepository(Fine).save(paidFine);

      // Try to start a ride - should be allowed since fine is paid
      const response = await request(app)
        .post('/rides/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ booking_id: bookingId })
        .expect(201);

      expect(response.body.message).toBe('Ride started successfully');
      expect(response.body.ride).toBeDefined();
      expect(response.body.ride.status).toBe('in_progress');
    });

    it('should block ride start when user has multiple unpaid fines', async () => {
      // Create multiple unpaid fines for the user
      const fine1 = new Fine();
      fine1.type = FineType.STATION_RETURN_VIOLATION;
      fine1.amount = 1000;
      fine1.status = FineStatus.PENDING;
      fine1.description = 'First violation';
      fine1.user_id = userId;
      await connection.getRepository(Fine).save(fine1);

      const fine2 = new Fine();
      fine2.type = FineType.VEHICLE_DAMAGE;
      fine2.amount = 5000;
      fine2.status = FineStatus.PENDING;
      fine2.description = 'Vehicle damage';
      fine2.user_id = userId;
      await connection.getRepository(Fine).save(fine2);

      // Try to start a ride - should be blocked due to unpaid fines
      const response = await request(app)
        .post('/rides/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ booking_id: bookingId })
        .expect(403);

      expect(response.body.error).toBe('User has unpaid fines');
      expect(response.body.details).toBe('Cannot start a new ride until fines are paid');
      // Should return info about one of the unpaid fines
      expect(response.body.unpaid_fine).toBeDefined();
    });
  });

  describe('Booking creation with unpaid fines check', () => {
    it('should block booking creation when user has unpaid fines', async () => {
      // Create an unpaid fine for the user
      const fine = new Fine();
      fine.type = FineType.VEHICLE_DAMAGE;
      fine.amount = 2000;
      fine.status = FineStatus.PENDING;
      fine.description = 'Scratches on vehicle';
      fine.user_id = userId;
      await connection.getRepository(Fine).save(fine);

      // Try to create a booking - should be blocked
      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ vehicleId: vehicleId })
        .expect(403);

      expect(response.body.error).toBe('User has unpaid fines');
      expect(response.body.details).toBe('Cannot create a new booking until fines are paid');
      expect(response.body.unpaid_fine).toBeDefined();
      expect(response.body.unpaid_fine.id).toBe(fine.id);
      expect(response.body.unpaid_fine.amount).toBe(2000);
    });

    it('should allow booking creation when user has no unpaid fines', async () => {
      // Ensure user has no unpaid fines
      const fines = await connection.getRepository(Fine).find({
        where: { user_id: userId, status: FineStatus.PENDING }
      });
      expect(fines.length).toBe(0);

      // Try to create a booking - should be allowed
      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ vehicleId: vehicleId })
        .expect(201);

      expect(response.status).toBe(201);
    });
  });

  describe('Fine status transitions', () => {
    it('should allow ride start after fine is paid', async () => {
      // Create an unpaid fine for the user
      const fine = new Fine();
      fine.type = FineType.STATION_RETURN_VIOLATION;
      fine.amount = 1000;
      fine.status = FineStatus.PENDING;
      fine.description = 'Late return fine';
      fine.user_id = userId;
      const savedFine = await connection.getRepository(Fine).save(fine);

      // First, verify ride start is blocked
      await request(app)
        .post('/rides/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ booking_id: bookingId })
        .expect(403);

      // Update the fine status to PAID
      savedFine.status = FineStatus.PAID;
      await connection.getRepository(Fine).save(savedFine);

      // Now try to start a ride - should be allowed
      const response = await request(app)
        .post('/rides/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ booking_id: bookingId })
        .expect(201);

      expect(response.body.message).toBe('Ride started successfully');
      expect(response.body.ride).toBeDefined();
      expect(response.body.ride.status).toBe('in_progress');
    });
  });
});