import request from 'supertest';
import { Connection, createConnection, getConnection } from 'typeorm';
import { Ride } from '../entities/Ride';
import { User } from '../entities/User';
import { Vehicle } from '../entities/Vehicle';
import { Fine, FineStatus, FineType } from '../entities/Fine';
import { app } from '../server'; // assuming your Express app is exported as 'app' from server.ts

describe('Fine System API', () => {
  let connection: Connection;
  let token: string;
  let userId: string;
  let rideId: string;
  let vehicleId: string;

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
    vehicle.status = 'in_ride';
    vehicle.price_per_minute = 10;
    vehicle.current_lat = 55.7558;
    vehicle.current_lng = 37.6173;
    await connection.getRepository(Vehicle).save(vehicle);
    vehicleId = vehicle.id;

    // Create a test ride
    const ride = new Ride();
    ride.status = 'in_progress';
    ride.start_time = new Date();
    ride.user = user;
    ride.vehicle = vehicle;
    ride.end_lat = 56.0; // Far from any station (will trigger violation)
    ride.end_lng = 38.0;
    await connection.getRepository(Ride).save(ride);
    rideId = ride.id;

    // Generate a test token (this might vary depending on your auth implementation)
    token = 'test_token'; // Replace with actual token generation
  });

  afterEach(async () => {
    await connection.getRepository(Ride).delete({});
    await connection.getRepository(Vehicle).delete({});
    await connection.getRepository(User).delete({});
    await connection.getRepository(Fine).delete({});
  });

  describe('Fine creation for ride violations', () => {
    it('should create a fine when user does not return to station', async () => {
      // Finish the ride which should trigger a fine
      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check response includes fine information
      expect(response.body.fine_issued).toBe(true);
      expect(response.body.fine_id).toBeDefined();
      expect(response.body.fine_amount).toBe(1000); // Default violation fine amount
      expect(response.body.violation_details).toBeDefined();

      // Verify the fine was created in the database
      const fines = await connection.getRepository(Fine).find({
        where: { user_id: userId }
      });

      expect(fines.length).toBe(1);
      expect(fines[0].type).toBe(FineType.STATION_RETURN_VIOLATION);
      expect(fines[0].status).toBe(FineStatus.PENDING);
      expect(fines[0].amount).toBe(1000);
      expect(fines[0].description).toContain('meters away from nearest station');
    });

    it('should not create a fine when user returns to station', async () => {
      // Update ride to have coordinates close to a station
      const rideRepo = connection.getRepository(Ride);
      const ride = await rideRepo.findOne(rideId);
      ride.end_lat = 55.7558; // Close to station coordinates
      ride.end_lng = 37.6173;
      await rideRepo.save(ride);

      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check response indicates no violation
      expect(response.body.return_to_station_verified).toBe(true);
      expect(response.body.fine_issued).toBeUndefined();

      // Verify no fines were created
      const fines = await connection.getRepository(Fine).find({
        where: { user_id: userId }
      });

      expect(fines.length).toBe(0);
    });

    it('should handle multiple violations for same user', async () => {
      // First violation
      let response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.fine_issued).toBe(true);

      // Create another ride that violates return policy
      const vehicle2 = new Vehicle();
      vehicle2.type = 'bicycle';
      vehicle2.model = 'Test Bike';
      vehicle2.status = 'in_ride';
      vehicle2.price_per_minute = 5;
      vehicle2.current_lat = 55.7558;
      vehicle2.current_lng = 37.6173;
      await connection.getRepository(Vehicle).save(vehicle2);

      const ride2 = new Ride();
      ride2.status = 'in_progress';
      ride2.start_time = new Date();
      ride2.user = { id: userId } as User;
      ride2.vehicle = vehicle2;
      ride2.end_lat = 57.0; // Far from any station
      ride2.end_lng = 39.0;
      await connection.getRepository(Ride).save(ride2);

      response = await request(app)
        .put(`/rides/${ride2.id}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check second violation also creates fine
      expect(response.body.fine_issued).toBe(true);

      // Verify both fines exist
      const fines = await connection.getRepository(Fine).find({
        where: { user_id: userId },
        order: { created_at: 'ASC' }
      });

      expect(fines.length).toBe(2);
      expect(fines[0].type).toBe(FineType.STATION_RETURN_VIOLATION);
      expect(fines[1].type).toBe(FineType.STATION_RETURN_VIOLATION);
    });

    it('should create a fine for vehicle damage', async () => {
      // Test the direct fine creation method for vehicle damage
      const fineRepo = connection.getRepository(Fine);

      // Create a fine for vehicle damage
      const damageFine = new Fine();
      damageFine.type = FineType.VEHICLE_DAMAGE;
      damageFine.amount = 5000; // Cost of repair/damage
      damageFine.status = FineStatus.PENDING;
      damageFine.description = 'Scratches and broken light on scooter';
      damageFine.user_id = userId;

      const savedFine = await fineRepo.save(damageFine);

      // Verify the fine was created correctly
      expect(savedFine.type).toBe(FineType.VEHICLE_DAMAGE);
      expect(savedFine.amount).toBe(5000);
      expect(savedFine.status).toBe(FineStatus.PENDING);
      expect(savedFine.description).toBe('Scratches and broken light on scooter');
      expect(savedFine.user_id).toBe(userId);
    });
  });

  describe('Fine management', () => {
    it('should retrieve all fines for a user', async () => {
      // Create multiple fines for the user
      const fineRepo = connection.getRepository(Fine);
      
      const fine1 = new Fine();
      fine1.type = FineType.STATION_RETURN_VIOLATION;
      fine1.amount = 1000;
      fine1.status = FineStatus.PENDING;
      fine1.description = 'First violation';
      fine1.user_id = userId;
      await fineRepo.save(fine1);

      const fine2 = new Fine();
      fine2.type = FineType.VEHICLE_DAMAGE;
      fine2.amount = 2500;
      fine2.status = FineStatus.PAID;
      fine2.description = 'Vehicle damage';
      fine2.user_id = userId;
      await fineRepo.save(fine2);

      // This would typically be done through a controller method
      // For now, we test the direct database query
      const userFines = await connection.getRepository(Fine).find({
        where: { user_id: userId },
        order: { created_at: 'DESC' }
      });

      expect(userFines.length).toBe(2);
      expect(userFines[0].type).toBe(FineType.VEHICLE_DAMAGE); // Most recent first
      expect(userFines[1].type).toBe(FineType.STATION_RETURN_VIOLATION);
    });

    it('should check for unpaid fines', async () => {
      // Create a pending fine
      const fineRepo = connection.getRepository(Fine);
      
      const pendingFine = new Fine();
      pendingFine.type = FineType.STATION_RETURN_VIOLATION;
      pendingFine.amount = 1000;
      pendingFine.status = FineStatus.PENDING;
      pendingFine.description = 'Unpaid violation';
      pendingFine.user_id = userId;
      await fineRepo.save(pendingFine);

      // Check if user has unpaid fines using direct DB query
      const unpaidFine = await connection.getRepository(Fine).findOne({
        where: {
          user_id: userId,
          status: FineStatus.PENDING
        }
      });

      expect(unpaidFine).toBeDefined();
      expect(unpaidFine.status).toBe(FineStatus.PENDING);

      // Create another fine but mark it as paid
      const paidFine = new Fine();
      paidFine.type = FineType.VEHICLE_DAMAGE;
      paidFine.amount = 2000;
      paidFine.status = FineStatus.PAID;
      paidFine.description = 'Paid fine';
      paidFine.user_id = userId;
      await fineRepo.save(paidFine);

      // Check again - should still have unpaid fine
      const unpaidFines = await connection.getRepository(Fine).find({
        where: {
          user_id: userId,
          status: FineStatus.PENDING
        }
      });

      expect(unpaidFines.length).toBe(1);
      expect(unpaidFines[0].id).toBe(pendingFine.id);
    });
  });
});