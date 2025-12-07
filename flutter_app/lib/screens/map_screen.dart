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
        mapObjects: [],
        focalPoint: Point(longitude: 37.6184, latitude: 55.7512),
        zoom: 15,
      ),
    );
  }
}