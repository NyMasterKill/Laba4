import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/vehicle.dart';
import '../screens/ride_screen.dart';
import '../services/booking_service.dart'; // Импортируем сервис
import '../services/auth_service.dart';
import 'dart:async'; // Для Timer
import 'dart:convert';

class VehicleCard extends StatefulWidget {
  final Vehicle vehicle;
  final int? distanceInMeters; // Опциональное расстояние до транспорта

  const VehicleCard({
    super.key,
    required this.vehicle,
    this.distanceInMeters,
  });

  @override
  State<VehicleCard> createState() => _VehicleCardState();
}

class _VehicleCardState extends State<VehicleCard> {
  Timer? _timer;
  Duration? _remainingTime;
  bool _isBookingInProgress = false; // Чтобы кнопка не была активна во время запроса
  bool _isStartingRide = false; // Чтобы кнопка не была активна во время запроса начала поездки

  @override
  void initState() {
    super.initState();
    _updateStateForVehicleStatus();
  }

  @override
  void didUpdateWidget(VehicleCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.vehicle.status != widget.vehicle.status) {
      _stopTimer();
      _updateStateForVehicleStatus();
    }
  }

  void _updateStateForVehicleStatus() {
    setState(() {
      if (widget.vehicle.status == 'reserved') {
        // ПОКА ЗАГЛУШКА: таймер на 15 минут с момента резервации
        // В реальности, нужно будет использовать end_time из объекта Booking.
        _startCountdownTimer(const Duration(minutes: 15));
      } else {
        _stopTimer();
        _remainingTime = null;
      }
    });
  }

  void _startCountdownTimer(Duration duration) {
    _remainingTime = duration;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_remainingTime != null && _remainingTime!.inSeconds > 0) {
          _remainingTime = Duration(seconds: _remainingTime!.inSeconds - 1);
        } else {
          _remainingTime = null;
          _stopTimer();
          // Сигнализировать, что время вышло?
          // Карта сама обновится при обновлении vehicle.status из MapScreen.
        }
      });
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _bookVehicle() async {
    if (widget.vehicle.status != 'available' || _isBookingInProgress) {
      return; // Не бронируем, если уже не доступен или идёт запрос
    }

    setState(() {
      _isBookingInProgress = true;
    });

    final bookingResult = await BookingService.createBooking(widget.vehicle.id);

    if (mounted) { // Проверяем, что виджет всё ещё смонтирован
      setState(() {
        _isBookingInProgress = false;
      });
    }

    if (bookingResult != null) {
      // Успешно забронировано. Видеокарта обновится через родителя (MapScreen) при изменении vehicle.status.
      print('Vehicle ${widget.vehicle.id} booked successfully!');
    } else {
      // Обработка ошибки. Можно показать SnackBar.
      print('Failed to book vehicle ${widget.vehicle.id}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка при бронировании транспорта')),
      );
    }
  }

  // 5.5.4. Начать поездку - открываем RideScreen
  Future<void> _startRide() async {
    if (widget.vehicle.status != 'reserved' || _isStartingRide) {
      return; // Не начинаем поездку, если транспорт не забронирован или идёт запрос
    }

    setState(() {
      _isStartingRide = true;
    });

    // Вызываем API для начала поездки
    final token = await AuthService().getToken();

    final response = await http.post(
      Uri.parse('${Config.apiUrl}/rides/start'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'vehicle_id': widget.vehicle.id,
        // В реальности здесь должен быть booking_id
      }),
    );

    if (mounted) { // Проверяем, что виджет всё ещё смонтирован
      setState(() {
        _isStartingRide = false;
      });
    }

    if (response.statusCode == 201) {
      // Успешно началась поездка - открываем экран поездки
      final rideData = jsonDecode(response.body);

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => RideScreen(
            vehicleId: rideData['ride']['id'],
            placemarks: [], // Маршрут будет отображаться на экране поездки
          ),
        ),
      );
    } else {
      // Обработка ошибки начала поездки
      final errorData = jsonDecode(response.body);
      print('Failed to start ride for vehicle ${widget.vehicle.id}: ${errorData['error']}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка при начале поездки: ${errorData['error']}')),
      );
    }
  }

  String _formatDuration(Duration duration) {
    if (duration.inSeconds <= 0) return '0:00';
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));
    return "${duration.inMinutes}:$twoDigitMinutes:$twoDigitSeconds";
  }

  @override
  Widget build(BuildContext context) {
    final bool isBookable = widget.vehicle.status == 'available' &&
        (widget.distanceInMeters == null || widget.distanceInMeters! <= 100);
    final bool isRideStartable = widget.vehicle.status == 'reserved' && _remainingTime != null; // Можно начать поездку, если транспорт забронирован

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Тип и модель
          Row(
            children: [
              Icon(widget.vehicle.type == 'scooter' ? Icons.electrical_services : Icons.pedal_bike_outlined),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${widget.vehicle.type == 'scooter' ? 'Самокат' : 'Велосипед'} ${widget.vehicle.model}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Заряд
          Row(
            children: [
              const Icon(Icons.battery_full),
              const SizedBox(width: 8),
              Text('Заряд: ${widget.vehicle.batteryLevel.toInt()}%'),
              const SizedBox(width: 16),
              // Прогресс-бар для заряда
              Expanded(
                child: LinearProgressIndicator(
                  value: widget.vehicle.batteryLevel / 100,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    widget.vehicle.batteryLevel > 50 ? Colors.green : (widget.vehicle.batteryLevel > 20 ? Colors.orange : Colors.red),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Цена в минуту
          Row(
            children: [
              const Icon(Icons.monetization_on),
              const SizedBox(width: 8),
              Text('Цена: ${widget.vehicle.pricePerMinute.toStringAsFixed(2)} \$/мин'),
            ],
          ),
          const SizedBox(height: 8),
          // Расстояние
          if (widget.distanceInMeters != null)
            Row(
              children: [
                const Icon(Icons.navigation),
                const SizedBox(width: 8),
                Text('Расстояние: ${widget.distanceInMeters!} м'),
              ],
            ),
          const SizedBox(height: 8), // Добавим отступ под таймер
          // Таймер, если статус reserved
          if (widget.vehicle.status == 'reserved' && _remainingTime != null)
            Row(
              children: [
                Icon(Icons.timer, color: Colors.orange,),
                const SizedBox(width: 8),
                Text(
                  'Бронь истекает: ${_formatDuration(_remainingTime!)}',
                  style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          const SizedBox(height: 8),
          // Кнопки для управления транспортом
          if (isBookable && !_isBookingInProgress)
            ElevatedButton(
              onPressed: _bookVehicle, // Вызываем наш метод
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
                foregroundColor: Colors.white,
              ),
              child: _isBookingInProgress
                  ? const CircularProgressIndicator(strokeWidth: 2, color: Colors.white,)
                  : const Text('Забронировать'), // Показываем индикатор загрузки
            )
          else if (isRideStartable)
            ElevatedButton(
              onPressed: !_isStartingRide ? _startRide : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: !_isStartingRide ? Colors.green : Colors.grey,
                foregroundColor: Colors.white,
              ),
              child: _isStartingRide
                  ? const CircularProgressIndicator(strokeWidth: 2, color: Colors.white,)
                  : const Text('Начать поездку'),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _stopTimer(); // Важно остановить таймер при удалении виджета
    super.dispose();
  }
}