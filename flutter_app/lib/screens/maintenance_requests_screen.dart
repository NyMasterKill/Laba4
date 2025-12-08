import 'package:flutter/material.dart';

class MaintenanceRequestsScreen extends StatefulWidget {
  const MaintenanceRequestsScreen({Key? key}) : super(key: key);

  @override
  State<MaintenanceRequestsScreen> createState() => _MaintenanceRequestsScreenState();
}

class _MaintenanceRequestsScreenState extends State<MaintenanceRequestsScreen> {
  // Фильтры
  String stationFilter = 'Все станции';
  String typeFilter = 'Все типы';
  String urgencyFilter = 'Все';

  // Список заявок на ТО
  final List<Map<String, dynamic>> _requests = [
    {
      'id': 1,
      'vehicleId': 'SC-001',
      'station': 'Центральная',
      'type': 'Плановое ТО',
      'urgency': 'Нормальный',
      'description': 'Плановая проверка электроники',
      'date': '2024-11-20',
      'employeeId': 'EMP-001',
      'status': 'Назначена'
    },
    {
      'id': 2,
      'vehicleId': 'BC-005',
      'station': 'Северная',
      'type': 'Ремонт',
      'urgency': 'Высокий',
      'description': 'Повреждение рамы',
      'date': '2024-11-21',
      'employeeId': 'EMP-002',
      'status': 'В работе'
    },
    {
      'id': 3,
      'vehicleId': 'SC-012',
      'station': 'Южная',
      'type': 'Диагностика',
      'urgency': 'Низкий',
      'description': 'Проверка тормозной системы',
      'date': '2024-11-22',
      'employeeId': 'EMP-003',
      'status': 'Ожидает'
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Заявки на ТО'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.red,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Фильтры
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Фильтры:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [
                        FilterChip(
                          label: const Text('Станция'),
                          selected: stationFilter != 'Все станции',
                          onSelected: (bool selected) {
                            // Открытие выпадающего списка для выбора станции
                            _showStationFilterDialog();
                          },
                        ),
                        FilterChip(
                          label: const Text('Тип'),
                          selected: typeFilter != 'Все типы',
                          onSelected: (bool selected) {
                            // Открытие выпадающего списка для выбора типа
                            _showTypeFilterDialog();
                          },
                        ),
                        FilterChip(
                          label: const Text('Срочность'),
                          selected: urgencyFilter != 'Все',
                          onSelected: (bool selected) {
                            // Открытие выпадающего списка для выбора срочности
                            _showUrgencyFilterDialog();
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Список заявок
            Expanded(
              child: ListView.builder(
                itemCount: _requests.length,
                itemBuilder: (context, index) {
                  final request = _requests[index];
                  return Card(
                    child: ListTile(
                      title: Text('${request['vehicleId']} - ${request['type']}'),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${request['station']}, ${request['date']}'),
                          Text('Срочность: ${request['urgency']}'),
                          Text('Статус: ${request['status']}'),
                        ],
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.check, color: Colors.green),
                        onPressed: () {
                          // Обработка нажатия кнопки "Выполнено"
                          _markAsCompleted(request['id']);
                        },
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

  void _showStationFilterDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Выберите станцию'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<String>(
                title: const Text('Все станции'),
                value: 'Все станции',
                groupValue: stationFilter,
                onChanged: (String? value) {
                  setState(() {
                    stationFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
              RadioListTile<String>(
                title: const Text('Центральная'),
                value: 'Центральная',
                groupValue: stationFilter,
                onChanged: (String? value) {
                  setState(() {
                    stationFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
              RadioListTile<String>(
                title: const Text('Северная'),
                value: 'Северная',
                groupValue: stationFilter,
                onChanged: (String? value) {
                  setState(() {
                    stationFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
              RadioListTile<String>(
                title: const Text('Южная'),
                value: 'Южная',
                groupValue: stationFilter,
                onChanged: (String? value) {
                  setState(() {
                    stationFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showTypeFilterDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Выберите тип'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<String>(
                title: const Text('Все типы'),
                value: 'Все типы',
                groupValue: typeFilter,
                onChanged: (String? value) {
                  setState(() {
                    typeFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
              RadioListTile<String>(
                title: const Text('Плановое ТО'),
                value: 'Плановое ТО',
                groupValue: typeFilter,
                onChanged: (String? value) {
                  setState(() {
                    typeFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
              RadioListTile<String>(
                title: const Text('Ремонт'),
                value: 'Ремонт',
                groupValue: typeFilter,
                onChanged: (String? value) {
                  setState(() {
                    typeFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
              RadioListTile<String>(
                title: const Text('Диагностика'),
                value: 'Диагностика',
                groupValue: typeFilter,
                onChanged: (String? value) {
                  setState(() {
                    typeFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showUrgencyFilterDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Выберите срочность'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<String>(
                title: const Text('Все'),
                value: 'Все',
                groupValue: urgencyFilter,
                onChanged: (String? value) {
                  setState(() {
                    urgencyFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
              RadioListTile<String>(
                title: const Text('Низкий'),
                value: 'Низкий',
                groupValue: urgencyFilter,
                onChanged: (String? value) {
                  setState(() {
                    urgencyFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
              RadioListTile<String>(
                title: const Text('Нормальный'),
                value: 'Нормальный',
                groupValue: urgencyFilter,
                onChanged: (String? value) {
                  setState(() {
                    urgencyFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
              RadioListTile<String>(
                title: const Text('Высокий'),
                value: 'Высокий',
                groupValue: urgencyFilter,
                onChanged: (String? value) {
                  setState(() {
                    urgencyFilter = value!;
                  });
                  Navigator.pop(context);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _markAsCompleted(int requestId) {
    // В реальном приложении тут будет вызов PATCH /logs
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Заявка выполнена'),
          content: const Text('Вы действительно хотите отметить заявку как выполненную?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('Отмена'),
            ),
            TextButton(
              onPressed: () {
                // Подтверждение выполнения заявки
                setState(() {
                  final index = _requests.indexWhere((request) => request['id'] == requestId);
                  if (index != -1) {
                    _requests[index]['status'] = 'Выполнена';
                  }
                });
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Заявка отмечена как выполненная')),
                );
              },
              child: const Text('Да'),
            ),
          ],
        );
      },
    );
  }
}