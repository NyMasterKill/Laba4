import 'package:flutter/material.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';
import '../config.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  late YandexMapController controller;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Карта'),
      ),
      body: YandexMap(
        onMapCreated: (YandexMapController yandexMapController) {
          controller = yandexMapController;
          // В будущем сюда можно добавить настройку стиля карты (тёмная тема)
          // и логику отображения станций и транспорта
        },
        // Используем API-ключ из config.dart
        // Примечание: в реальности ключ может передаваться через нативные файлы (см. AndroidManifest.xml, Info.plist)
        // или через flutter_config, но для демонстрации инициализации пакета этого достаточно.
        // Повторюсь, в продакшене хранение ключа в коде НЕБЕЗОПАСНО.
        mapObjects: [],
        // Устанавливаем начальную позицию (Москва, Красная площадь) и масштаб
        // Эти значения могут быть заменены на реальное местоположение пользователя позже
        focalPoint: Point(longitude: 37.6184, latitude: 55.7512),
        zoom: 15,
      ),
    );
  }
}