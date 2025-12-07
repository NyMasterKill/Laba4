// lib/models/vehicle.dart
import 'package:hive/hive.dart';
part 'vehicle.g.dart'; // Это файл, который будет сгенерирован build_runner

@HiveType(typeId: 1)
class Vehicle {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String type; // bicycle, scooter
  @HiveField(2)
  final String model;
  @HiveField(3)
  final double batteryLevel; // 0-100
  @HiveField(4)
  final double pricePerMinute;
  @HiveField(5)
  final double currentLat;
  @HiveField(6)
  final double currentLng;
  @HiveField(7)
  final String status; // available, reserved, in_ride, etc.

  Vehicle({
    required this.id,
    required this.type,
    required this.model,
    required this.batteryLevel,
    required this.pricePerMinute,
    required this.currentLat,
    required this.currentLng,
    required this.status,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] as String,
      type: json['type'] as String,
      model: json['model'] as String,
      batteryLevel: (json['battery_level'] ?? json['batteryLevel']) as double? ?? 0.0,
      pricePerMinute: (json['price_per_minute'] ?? json['pricePerMinute']) as double? ?? 0.0,
      currentLat: (json['current_lat'] ?? json['currentLat']) as double? ?? 0.0,
      currentLng: (json['current_lng'] ?? json['currentLng']) as double? ?? 0.0,
      status: json['status'] as String? ?? 'unknown',
    );
  }
}