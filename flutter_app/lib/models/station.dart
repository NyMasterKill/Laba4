// lib/models/station.dart
class Station {
  final String id;
  final String name;
  final double lat;
  final double lng;
  final int totalPlaces;
  final int availablePlaces; // или список available_vehicles

  Station({
    required this.id,
    required this.name,
    required this.lat,
    required this.lng,
    required this.totalPlaces,
    required this.availablePlaces,
  });

  factory Station.fromJson(Map<String, dynamic> json) {
    return Station(
      id: json['id'] as String,
      name: json['name'] as String,
      lat: (json['lat'] ?? json['current_lat'] ?? json['currentLat']) as double? ?? 0.0,
      lng: (json['lng'] ?? json['current_lng'] ?? json['currentLng']) as double? ?? 0.0,
      totalPlaces: json['total_places'] as int? ?? 0,
      availablePlaces: json['available_places'] as int? ?? 0,
    );
  }
}