import request from 'supertest';
import { Connection, createConnection, getConnection } from 'typeorm';
import { Ride } from '../entities/Ride';
import { User } from '../entities/User';
import { Vehicle } from '../entities/Vehicle';
import { Station } from '../entities/Station';
import { app } from '../server'; // assuming your Express app is exported as 'app' from server.ts

describe('Ride Station Return Verification API', () => {
  let connection: Connection;
  let token: string;
  let rideId: string;
  let stationId: string;
  let vehicleId: string;

  beforeAll(async () => {
    connection = await createConnection();
  });

  afterAll(async () => {
    await getConnection().close();
  });

  beforeEach(async () => {
    // Create a test station
    const station = new Station();
    station.name = 'Test Station';
    station.description = 'Test Station Description';
    station.lat = 55.7558; // Moscow coordinates
    station.lng = 37.6173;
    station.capacity = 20;
    station.is_active = true;
    await connection.getRepository(Station).save(station);
    stationId = station.id;

    // Create a test user
    const user = new User();
    user.email = 'test@example.com';
    user.password = 'hashed_password';
    await connection.getRepository(User).save(user);

    // Create a test vehicle near the station
    const vehicle = new Vehicle();
    vehicle.type = 'scooter';
    vehicle.model = 'Test Model';
    vehicle.status = 'in_ride';
    vehicle.price_per_minute = 10;
    vehicle.current_lat = 55.7560; // Near the station (within 50m)
    vehicle.current_lng = 37.6175;
    await connection.getRepository(Vehicle).save(vehicle);
    vehicleId = vehicle.id;

    // Create a test ride
    const ride = new Ride();
    ride.status = 'in_progress';
    ride.start_time = new Date();
    ride.user = user;
    ride.vehicle = vehicle;
    ride.end_lat = 55.7560; // Near the station (within 50m)
    ride.end_lng = 37.6175;
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
    await connection.getRepository(Station).delete({});
  });

  describe('PUT /rides/:id/finish with station return verification', () => {
    it('should finish a ride successfully and verify return to station', async () => {
      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Ride finished successfully');
      expect(response.body.ride.id).toBe(rideId);
      expect(response.body.ride.status).toBe('completed');
      expect(response.body.ride.total_cost).toBeDefined();
      // Should confirm return to station verification
      expect(response.body.return_to_station_verified).toBe(true);

      // Verify that the ride was updated in the database
      const updatedRide = await connection.getRepository(Ride).findOne(rideId);
      expect(updatedRide.status).toBe('completed');
      expect(updatedRide.end_time).toBeDefined();
      expect(updatedRide.total_cost).toBeDefined();
    });

    it('should detect violation when user finishes ride far from station', async () => {
      // Update ride to have coordinates far from any station
      const rideRepo = connection.getRepository(Ride);
      const ride = await rideRepo.findOne(rideId);
      ride.end_lat = 50.0; // Far away coordinates
      ride.end_lng = 50.0;
      await rideRepo.save(ride);

      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Ride finished successfully');
      expect(response.body.violation_details).toBeDefined();
      expect(response.body.return_to_station_required).toBe(false);
      expect(response.body.return_to_station_verified).toBeUndefined(); // Should not be verified
    });

    it('should handle ride finish when no end coordinates are available', async () => {
      // Update ride to have no end coordinates
      const rideRepo = connection.getRepository(Ride);
      const ride = await rideRepo.findOne(rideId);
      ride.end_lat = null;
      ride.end_lng = null;
      await rideRepo.save(ride);

      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Ride finished successfully');
      expect(response.body.violation_details).toBeDefined(); // Should detect violation due to missing coordinates
    });

    it('should verify return based on vehicle coordinates when ride end coordinates are missing', async () => {
      // Update ride to have no end coordinates but vehicle has coordinates near station
      const rideRepo = connection.getRepository(Ride);
      const ride = await rideRepo.findOne(rideId);
      ride.end_lat = null;
      ride.end_lng = null;
      await rideRepo.save(ride);

      // Make sure vehicle coordinates are near the station
      const vehicleRepo = connection.getRepository(Vehicle);
      const vehicle = await vehicleRepo.findOne(vehicleId);
      vehicle.current_lat = 55.7559; // Very close to station
      vehicle.current_lng = 37.6174;
      await vehicleRepo.save(vehicle);

      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Ride finished successfully');
      // Should verify return based on vehicle coordinates
      expect(response.body.return_to_station_verified).toBe(true);
    });
  });

  describe('isWithinStationRadius function behavior', () => {
    it('should correctly identify when user is within station radius', async () => {
      // This test verifies the internal function behavior through the API
      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // The ride coordinates are set very close to the station, so it should verify return
      expect(response.body.return_to_station_verified).toBe(true);
    });

    it('should correctly identify when user is outside station radius', async () => {
      // Update ride to be far from any station
      const rideRepo = connection.getRepository(Ride);
      const ride = await rideRepo.findOne(rideId);
      ride.end_lat = 10.0; // Very far coordinates
      ride.end_lng = 10.0;
      await rideRepo.save(ride);

      const response = await request(app)
        .put(`/rides/${rideId}/finish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should detect violation
      expect(response.body.violation_details).toBeDefined();
      expect(response.body.return_to_station_required).toBe(false);
    });
  });
});