import 'package:flutter/material.dart';
import '../models/vehicle.dart';

class VehicleCard extends StatelessWidget {
  final Vehicle vehicle;
  final int? distanceInMeters; // Опциональное расстояние до транспорта

  const VehicleCard({
    super.key,
    required this.vehicle,
    this.distanceInMeters,
  });

  @override
  Widget build(BuildContext context) {
    // Логика для определения, доступна ли кнопка "Забронировать"
    // Пока: кнопка disabled, если статус не 'available' или distance > 100
    final bool isBookable = vehicle.status == 'available' &&
        (distanceInMeters == null || distanceInMeters! <= 100);

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Тип и модель
          Row(
            children: [
              Icon(vehicle.type == 'scooter' ? Icons.electrical_services : Icons.pedal_bike_outlined),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${vehicle.type == 'scooter' ? 'Самокат' : 'Велосипед'} ${vehicle.model}',
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
              Text('Заряд: ${vehicle.batteryLevel.toInt()}%'),
              const SizedBox(width: 16),
              // Прогресс-бар для заряда
              Expanded(
                child: LinearProgressIndicator(
                  value: vehicle.batteryLevel / 100,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    vehicle.batteryLevel > 50 ? Colors.green : (vehicle.batteryLevel > 20 ? Colors.orange : Colors.red),
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
              Text('Цена: ${vehicle.pricePerMinute.toStringAsFixed(2)} \$/мин'),
            ],
          ),
          const SizedBox(height: 8),
          // Расстояние
          if (distanceInMeters != null)
            Row(
              children: [
                const Icon(Icons.navigation),
                const SizedBox(width: 8),
                Text('Расстояние: ${distanceInMeters!} м'),
              ],
            ),
          const SizedBox(height: 16),
          // Кнопка "Забронировать"
          ElevatedButton(
            onPressed: isBookable
                ? () {
                    // TODO: Реализовать логику бронирования при нажатии
                    print('Попытка забронировать транспорт: ${vehicle.id}');
                  }
                : null, // Если isBookable = false, кнопка disabled
            style: ElevatedButton.styleFrom(
              backgroundColor: isBookable ? Theme.of(context).primaryColor : Colors.grey,
              foregroundColor: Colors.white,
            ),
            child: Text('Забронировать'),
          ),
        ],
      ),
    );
  }
}