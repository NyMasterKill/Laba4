import request from 'supertest';
import { Connection, createConnection, getConnection } from 'typeorm';
import { Ride } from '../entities/Ride';
import { User } from '../entities/User';
import { Vehicle } from '../entities/Vehicle';
import { app } from '../server'; // assuming your Express app is exported as 'app' from server.ts

describe('Ride Finish API', () => {
  let connection: Connection;
  let token: string;
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
    await connection.getRepository(User).save(user);

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
    await connection.getRepository(Ride).save(ride);
    rideId = ride.id;

    // Generate a test token (this might vary depending on your auth implementation)
    // This is a simplified example - in real implementation you might need to login first
    token = 'test_token'; // Replace with actual token generation
  });

  afterEach(async () => {
    await connection.getRepository(Ride).delete({});
    await connection.getRepository(Vehicle).delete({});
    await connection.getRepository(User).delete({});
  });

  describe('PUT /rides/:id/finish', () => {
    it('should finish a ride successfully', async () => {
      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Ride finished successfully');
      expect(response.body.ride.id).toBe(rideId);
      expect(response.body.ride.status).toBe('completed');
      expect(response.body.ride.total_cost).toBeDefined();

      // Verify that the ride was updated in the database
      const updatedRide = await connection.getRepository(Ride).findOne(rideId);
      expect(updatedRide.status).toBe('completed');
      expect(updatedRide.end_time).toBeDefined();
      expect(updatedRide.total_cost).toBeDefined();

      // Verify that the vehicle status was updated to 'available'
      const updatedVehicle = await connection.getRepository(Vehicle).findOne(vehicleId);
      expect(updatedVehicle.status).toBe('available');
    });

    it('should return 401 if user is not authenticated', async () => {
      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 if ride does not exist', async () => {
      const fakeRideId = 'non-existent-id';
      const response = await request(app)
        .put(`/rides/${fakeRideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Ride not found');
    });

    it('should return 400 if ride is not in progress', async () => {
      // Update the ride to be already completed
      const rideRepo = connection.getRepository(Ride);
      const ride = await rideRepo.findOne(rideId);
      ride.status = 'completed';
      await rideRepo.save(ride);

      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.error).toBe('Ride is not in progress');
    });

    it('should return 400 if ride id is not provided', async () => {
      const response = await request(app)
        .put('/rides//finish') // intentionally empty ID
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.error).toBe('Ride ID is required');
    });
  });
});