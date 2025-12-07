import 'package:flutter/material.dart';
import 'package:yandex_mapkit/yandex_mapkit.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';
import '../services/auth_service.dart';

class RideScreen extends StatefulWidget {
  final String vehicleId;
  final List<PlacemarkMapObject> placemarks;
  
  const RideScreen({
    Key? key, 
    required this.vehicleId, 
    required this.placemarks
  }) : super(key: key);

  @override
  _RideScreenState createState() => _RideScreenState();
}

class _RideScreenState extends State<RideScreen> {
  // 5.5.1. Дизайн панели (время, стоимость, карта)
  bool _isRideStarted = false;
  int _rideDuration = 0; // in seconds
  double _currentCost = 0.0;
  Timer? _timer;
  
  YandexMapController? _mapController;
  List<Polyline> _polyline = [];
  List<Point> _routePoints = [];

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  // 5.5.2. Подписка на события поездки
  void _startRide() async {
    final token = await AuthService().getToken();
    final userId = await AuthService().getUserId();
    
    final response = await http.post(
      Uri.parse('${Config.apiUrl}/rides/start'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'booking_id': widget.vehicleId, // В реальности это должен быть booking_id
      }),
    );

    if (response.statusCode == 201) {
      setState(() {
        _isRideStarted = true;
      });
      
      // Запуск таймера
      _startTimer();
      
      // TODO: Здесь должна быть подписка на WebSocket/SSE для получения обновлений
      _subscribeToRideUpdates();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Поездка началась!')),
      );
    } else {
      // Обработка ошибки
      final errorData = jsonDecode(response.body);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка: ${errorData['error']}')),
      );
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _rideDuration++;
        // Расчёт примерной стоимости (в реальности это будет приходить с сервера)
        _currentCost = (_rideDuration / 60) * 5; // 5 руб/мин как пример
      });
    });
  }

  // 5.5.3. Отображение GPS-трека на карте
  void _subscribeToRideUpdates() {
    // В реальности здесь будет WebSocket/SSE подписка
    // Пока что симулируем получение обновлений
    Timer.periodic(const Duration(seconds: 10), (timer) {
      if (_isRideStarted) {
        // Симуляция получения новых координат
        _updateMapRoute();
      }
    });
  }

  void _updateMapRoute() {
    if (_mapController != null) {
      // В реальности координаты будут приходить с сервера
      // Пока что просто добавляем случайные точки
      setState(() {
        _routePoints.add(Point(
          latitude: 55.7512 + (_routePoints.length * 0.001), 
          longitude: 37.6184 + (_routePoints.length * 0.001)
        ));
        
        // Обновляем полилинию
        _polyline = [
          Polyline(
            points: _routePoints,
            strokeColor: Colors.blue,
            strokeWidth: 4,
          ),
        ];
      });
      
      _mapController!.addPolyline(_polyline.first);
    }
  }

  // 5.5.4. Кнопка «Завершить поездку»
  void _finishRide() async {
    setState(() {
      _isRideStarted = false;
    });
    
    _timer?.cancel();
    
    // TODO: Вызов API для завершения поездки
    final token = await AuthService().getToken();
    
    final response = await http.put(
      Uri.parse('${Config.apiUrl}/rides/${widget.vehicleId}/finish'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    
    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Поездка завершена!')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ошибка при завершении поездки')),
      );
    }
  }

  String _formatDuration(int seconds) {
    int minutes = (seconds / 60).floor();
    int remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Активная поездка'),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Карта
          Expanded(
            flex: 2,
            child: YandexMap(
              onMapCreated: (controller) async {
                _mapController = controller;
                
                // Добавляем переданные метки
                await controller.addPlacemarks(widget.placemarks);
                
                // Если есть маршрут, добавляем его
                if (_polyline.isNotEmpty) {
                  await controller.addPolylines(_polyline);
                }
              },
              // Устанавливаем начальный вид карты
              mapObjects: MapObjects(
                placemarks: widget.placemarks,
                polylines: _polyline,
              ),
            ),
          ),
          
          // 5.5.1. Дизайн панели (время, стоимость, карта)
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.black,
              border: Border(
                top: BorderSide(color: Colors.grey[800]!),
              ),
            ),
            child: Column(
              children: [
                // Время и стоимость
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        const Text(
                          'Время',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          _formatDuration(_rideDuration),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      children: [
                        const Text(
                          'Стоимость',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          '${_currentCost.toStringAsFixed(2)} ₽',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Кнопки управления
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isRideStarted ? null : _startRide,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isRideStarted ? Colors.grey : Colors.red,
                          foregroundColor: Colors.white,
                        ),
                        child: _isRideStarted 
                            ? const Text('Поездка активна') 
                            : const Text('Начать поездку'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isRideStarted ? _finishRide : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isRideStarted ? Colors.red : Colors.grey,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Завершить'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}