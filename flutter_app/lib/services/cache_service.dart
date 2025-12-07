// lib/services/cache_service.dart
import 'package:hive/hive.dart';
import '../models/vehicle.dart';
import '../models/station.dart';
import 'dart:convert';

class CacheService {
  static const String _cacheBoxName = 'cache';
  static const String _vehiclesDataKey = 'vehicles_data';
  static const String _vehiclesTimestampKey = 'vehicles_timestamp';
  static const String _stationsDataKey = 'stations_data';
  static const String _stationsTimestampKey = 'stations_timestamp';
  static const Duration _cacheTtl = Duration(minutes: 5);

  static late Box _cacheBox;

  static Future<void> init() async {
    // Регистрируем адаптеры
    Hive.registerAdapter(VehicleAdapter());
    Hive.registerAdapter(StationAdapter());

    // Открываем или создаём box 'cache'
    _cacheBox = await Hive.openBox(_cacheBoxName);
  }

  static Future<List<Vehicle>?> getVehiclesFromCache() async {
    final timestamp = _cacheBox.get(_vehiclesTimestampKey) as int?;
    if (timestamp == null) {
      print('No cached vehicles timestamp found.');
      return null;
    }

    final cachedTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
    if (DateTime.now().difference(cachedTime) >= _cacheTtl) {
      print('Cached vehicles are expired.');
      return null;
    }

    final data = _cacheBox.get(_vehiclesDataKey) as List?;
    if (data == null) {
      print('No cached vehicles data found.');
      return null;
    }

    // Hive возвращает List<dynamic>, приводим к List<Vehicle>
    try {
      final vehicles = (data as List).cast<Vehicle>();
      print('Loaded ${vehicles.length} vehicles from cache.');
      return vehicles;
    } catch (e) {
      print('Error casting cached vehicles to List<Vehicle>: $e');
      return null;
    }
  }

  static Future<void> setVehiclesInCache(List<Vehicle> vehicles) async {
    await _cacheBox.put(_vehiclesDataKey, vehicles); // Hive сериализует список
    await _cacheBox.put(_vehiclesTimestampKey, DateTime.now().millisecondsSinceEpoch);
    print('Saved ${vehicles.length} vehicles to cache.');
  }

  static Future<List<Station>?> getStationsFromCache() async {
    final timestamp = _cacheBox.get(_stationsTimestampKey) as int?;
    if (timestamp == null) {
      print('No cached stations timestamp found.');
      return null;
    }

    final cachedTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
    if (DateTime.now().difference(cachedTime) >= _cacheTtl) {
      print('Cached stations are expired.');
      return null;
    }

    final data = _cacheBox.get(_stationsDataKey) as List?;
    if (data == null) {
      print('No cached stations data found.');
      return null;
    }

    try {
      final stations = (data as List).cast<Station>();
      print('Loaded ${stations.length} stations from cache.');
      return stations;
    } catch (e) {
      print('Error casting cached stations to List<Station>: $e');
      return null;
    }
  }

  static Future<void> setStationsInCache(List<Station> stations) async {
    await _cacheBox.put(_stationsDataKey, stations);
    await _cacheBox.put(_stationsTimestampKey, DateTime.now().millisecondsSinceEpoch);
    print('Saved ${stations.length} stations to cache.');
  }

  // Опционально: метод для очистки кэша
  static Future<void> clearCache() async {
    await _cacheBox.clear();
  }
}