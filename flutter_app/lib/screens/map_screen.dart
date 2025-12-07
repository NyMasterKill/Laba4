import 'package:flutter/material.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';
import '../config.dart';
import '../models/vehicle.dart'; // Импортируем модель
import 'dart:convert';
import 'package:http/http.dart' as http;

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  late YandexMapController controller;
  List<Vehicle> _vehicles = [];
  List<MapObject> _mapObjects = [];

  @override
  void initState() {
    super.initState();
    // Загружаем транспорт при инициализации экрана
    _loadVehicles(55.7512, 37.6184, 1000); // Пример: Москва, радиус 1 км
  }

  // Метод для загрузки транспорта с API
  Future<void> _loadVehicles(double lat, double lng, double radius) async {
    try {
      final response = await http.get(
        Uri.parse('http://localhost:3000/api/vehicles/nearby?lat=$lat&lng=$lng&radius=$radius'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final vehicles = data.map((json) => Vehicle.fromJson(json)).toList();

        setState(() {
          _vehicles = vehicles;
          _mapObjects = _createMapObjects();
        });
      } else {
        print('Failed to load vehicles: ${response.statusCode} - ${response.body}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка загрузки транспорта'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      print('Error loading vehicles: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Ошибка сети при загрузке транспорта'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Метод для создания MapObject из списка транспорта
  List<MapObject> _createMapObjects() {
    List<MapObject> objects = [];
    for (Vehicle vehicle in _vehicles) {
      // Создаём значок на основе типа транспорта
      // Пока используем простой цветной круг в качестве иконки
      Color color = vehicle.type == 'scooter' ? Colors.blue : Colors.green;
      final icon = _createBitmapDescriptor(color);

      objects.add(PlacemarkMapObject(
        mapId: MapObjectId('vehicle_${vehicle.id}'),
        point: Point(latitude: vehicle.currentLat, longitude: vehicle.currentLng),
        icon: PlacemarkIcon(
          // Используем цветной круг как иконку
          icon: icon,
          scale: 1.0,
        ),
        // onTap: () => _onPlacemarkTap(vehicle), // Добавим позже
      ));
    }
    return objects;
  }

  // Вспомогательный метод для создания BitmapDescriptor
  Future<BitmapDescriptor> _createBitmapDescriptor(Color color) async {
    // Для простоты, создадим BitmapDescriptor из цветного круга
    // В реальности, это будет загрузка из assets
    final ui = await import('dart:ui' as 'dart:ui');
    // Используем временный способ создания иконки, т.к. BitmapDescriptor.fromAssetImage требует реальный файл
    // Для демонстрации просто возвращаем стандартный значок или пустой
    // Я попробую использовать BitmapDescriptor.fromColor, если доступно, или вернуть стандартный значок
    // На практике, это был бы файл в assets/icons/
    // Пока возвращаю стандартный значок
    return BitmapDescriptor.defaultMarker; // Заглушка
    //return BitmapDescriptor.fromColor(color);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Карта'),
      ),
      body: YandexMap(
        onMapCreated: (YandexMapController yandexMapController) async {
          controller = yandexMapController;
          // Пример настройки тёмной темы карты
          // Используем JSON-описание стиля для тёмной темы
          const darkThemeStyle = r'''
          {
            "base": {
              "scheme": "v9dark"
            },
            "layers": {
              "roads": {
                "style": "simplified"
              }
            }
          }
          ''';
          try {
            await controller.setMapStyle(style: MapStyle.loadStyleString(darkThemeStyle));
          } catch (e) {
            // Обработка ошибки загрузки стиля и уведомление пользователя
            print('Failed to load dark map style: $e');
            // Используем ScaffoldMessenger для показа сообщения об ошибке
            // Это позволяет отобразить SnackBar поверх текущего Scaffold
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Ошибка при загрузке темы карты: ${e.toString()}'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        // Передаём сгенерированные объекты на карту
        mapObjects: _mapObjects,
        focalPoint: Point(longitude: 37.6184, latitude: 55.7512),
        zoom: 15,
      ),
    );
  }
}