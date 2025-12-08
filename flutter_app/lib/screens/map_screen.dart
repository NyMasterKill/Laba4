import 'package:flutter/material.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';
import '../config.dart';
import '../models/vehicle.dart';
import '../models/station.dart'; // Импортируем модель станции
import '../widgets/vehicle_card.dart'; // Импортируем новый виджет
import '../services/cache_service.dart'; // Импортируем CacheService
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../widgets/block_notification_banner.dart'; // 7.5.4. Реализовать уведомление о блокировке

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  late YandexMapController controller;
  List<Vehicle> _vehicles = [];
  List<Station> _stations = [];
  List<MapObject> _mapObjects = [];
  bool _isLoading = true; // Добавляем индикатор загрузки

  // TODO: 3.3.1: Заменить defaultMarker на иконки из assets/icons/.
  // TODO: 3.3.4: Реализовать кластеризацию для отображения большого количества станций/транспорта.
  // TODO: 3.3.5: Реализовать debounce для запросов при изменении камеры карты.
  // TODO: 3.4.x: Получить реальную геопозицию пользователя для расчёта расстояния.

  // Фиктивная позиция пользователя. В реальности будет получена через geolocator.
  final Point _userCurrentPosition = const Point(latitude: 55.7512, longitude: 37.6184);

  @override
  void initState() {
    super.initState();
    // Инициализируем кэш
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await CacheService.init(); // Убедимся, что Hive готов
      await initMapObjects(lat: 55.7512, lng: 37.6184, radius: 1000); // Пример: Москва, радиус 1 км
    });
  }

  // Асинхронный метод инициализации объектов на карте
  Future<void> initMapObjects({required double lat, required double lng, required double radius}) async {
    // Попробуем загрузить данные из кэша
    final cachedVehicles = await CacheService.getVehiclesFromCache();

    if (cachedVehicles != null) {
      print('Loaded ${cachedVehicles.length} vehicles from cache.');
      setState(() {
        _vehicles = cachedVehicles;
        _mapObjects = _createMapObjects(); // Используем обновлённую версию _createMapObjects
        _isLoading = false; // Убираем индикатор загрузки, чтобы показать кэшированные данные
      });
    } else {
      print('No valid cache for vehicles found. Keeping loading indicator.');
    }

    // Загружаем транспорт с API (обновляем кэш)
    await _loadVehicles(lat, lng, radius);

    // Загружаем фиктивные станции (в реальности - вызов API)
    _stations = _getMockStations();

    // Обновляем состояние для новых данных (из API)
    final objects = await _createMapObjects(); // Используем обновлённую версию _createMapObjects
    setState(() {
      _mapObjects = objects;
      _isLoading = false; // Убираем индикатор загрузки после получения новых данных
    });
  }

  // Фиктивная загрузка станций
  List<Station> _getMockStations() {
    return [
      Station(
        id: 'station_1',
        name: 'Станция Красная Площадь',
        lat: 55.7505,
        lng: 37.6184,
        totalPlaces: 20,
        availablePlaces: 15,
      ),
      Station(
        id: 'station_2',
        name: 'Станция Мавзолей',
        lat: 55.7520,
        lng: 37.6190,
        totalPlaces: 15,
        availablePlaces: 8,
      ),
      // Добавьте больше станций по необходимости
    ];
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

        // Обновляем локальное состояние
        setState(() {
          _vehicles = vehicles;
          // _mapObjects обновляется в initMapObjects после загрузки и станций
        });

        // Сохраняем в кэш
        await CacheService.setVehiclesInCache(vehicles);
        print('Saved ${vehicles.length} vehicles to cache.');
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

  // Метод для создания MapObject из списков транспорта и станций
  // Принимает _vehicles и _stations из State, так как они уже обновлены
  Future<List<MapObject>> _createMapObjects() async {
    List<MapObject> objects = [];

    // Создаём значки для транспорта
    for (Vehicle vehicle in _vehicles) {
      // Используем стандартный маркер. В реальности:
      // final icon = await BitmapDescriptor.fromAssetImage(
      //   ImageConfiguration(devicePixelRatio: 1.0),
      //   vehicle.type == 'scooter' ? 'assets/icons/scooter_icon.png' : 'assets/icons/bicycle_icon.png',
      // );
      final icon = BitmapDescriptor.defaultMarker; // Заглушка

      objects.add(PlacemarkMapObject(
        mapId: MapObjectId('vehicle_${vehicle.id}'),
        point: Point(latitude: vehicle.currentLat, longitude: vehicle.currentLng),
        icon: PlacemarkIcon(
          icon: icon,
          scale: 1.0,
        ),
        // Обработка нажатия на транспорт
        onTap: (point) => _onPlacemarkTap('vehicle', vehicle.id),
      ));
    }

    // Создаём значки для станций
    for (Station station in _stations) {
      // Используем стандартный маркер для станции. В реальности:
      // final icon = await BitmapDescriptor.fromAssetImage(
      //   ImageConfiguration(devicePixelRatio: 1.0),
      //   'assets/icons/station_icon.png',
      // );
      final icon = BitmapDescriptor.defaultMarker; // Заглушка

      objects.add(PlacemarkMapObject(
        mapId: MapObjectId('station_${station.id}'),
        point: Point(latitude: station.lat, longitude: station.lng),
        icon: PlacemarkIcon(
          icon: icon,
          scale: 1.0,
        ),
        // Обработка нажатия на станцию
        onTap: (point) => _onPlacemarkTap('station', station.id),
      ));
    }

    return objects;
  }

  // Обработчик нажатия на Placemark
  void _onPlacemarkTap(String type, String id) {
    print('Placemark tapped: Type = $type, ID = $id');

    // Если нажатие на транспорт
    if (type == 'vehicle') {
      // Найти объект транспорта по ID
      final vehicle = _vehicles.firstWhere((v) => v.id == id, orElse: () => throw Exception('Vehicle not found'));
      // Вычислить расстояние до транспорта от текущей позиции пользователя
      final distance = calculateDistance(_userCurrentPosition, Point(latitude: vehicle.currentLat, longitude: vehicle.currentLng));
      // Показать карточку транспорта в модальном окне
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true, // Позволяет карточке растягиваться
        builder: (BuildContext modalContext) {
          return VehicleCard(vehicle: vehicle, distanceInMeters: distance.toInt());
        },
      );
    } else if (type == 'station') {
      // TODO: Реализовать карточку для станции
      print('Station tapped, ID = $id');
    }
  }

  @override
  Widget build(BuildContext context) {
    // 7.5.4. Реализовать уведомление о блокировке
    return BlockNotificationBanner(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Карта'),
        ),
        body: Stack(
          children: [
            // Карта
            YandexMap(
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
            // Индикатор загрузки поверх карты
            if (_isLoading)
              Container(
                color: Colors.black.withOpacity(0.3), // Полупрозрачный оверлей
                child: const Center(
                  child: CircularProgressIndicator(),
                ),
              ),
          ],
        ),
      ),
    );
  }
}