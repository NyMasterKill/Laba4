import 'package:flutter/material.dart';

class TariffsScreen extends StatefulWidget {
  const TariffsScreen({Key? key}) : super(key: key);

  @override
  State<TariffsScreen> createState() => _TariffsScreenState();
}

class _TariffsScreenState extends State<TariffsScreen> {
  final List<Map<String, dynamic>> _tariffs = [
    {'id': 1, 'name': 'Стандартный', 'pricePerMinute': 5.0, 'freeMinutes': 0},
    {'id': 2, 'name': 'Премиум', 'pricePerMinute': 3.0, 'freeMinutes': 30},
    {'id': 3, 'name': 'Студенческий', 'pricePerMinute': 2.0, 'freeMinutes': 60},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Управление тарифами'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.red,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            ElevatedButton(
              onPressed: () {
                // Добавить новый тариф
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text('Добавить тариф'),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: _tariffs.length,
                itemBuilder: (context, index) {
                  final tariff = _tariffs[index];
                  return Card(
                    child: ListTile(
                      title: Text(tariff['name']),
                      subtitle: Text('Цена за минуту: ${tariff['pricePerMinute']} ₽, '
                          'Бесплатные минуты: ${tariff['freeMinutes']}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit),
                            onPressed: () {
                              // Редактировать тариф
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete),
                            onPressed: () {
                              // Удалить тариф
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}