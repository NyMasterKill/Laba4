import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';
import '../services/auth_service.dart';

class FinesScreen extends StatefulWidget {
  const FinesScreen({super.key});

  @override
  _FinesScreenState createState() => _FinesScreenState();
}

class _FinesScreenState extends State<FinesScreen> {
  List<dynamic> fines = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFines();
  }

  Future<void> _loadFines() async {
    try {
      final token = await AuthService().getToken();
      final userId = await AuthService().getUserId();

      final response = await http.get(
        Uri.parse('${Config.apiUrl}/fines/user/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          fines = data;
          isLoading = false;
        });
      } else {
        setState(() {
          isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ошибка при загрузке штрафов')),
        );
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка сети: $e')),
      );
    }
  }

  // 7.5.3. Добавить кнопку «Оплатить штраф» → T-bank
  Future<void> _payFine(String fineId, double amount) async {
    // Переход на экран оплаты T-bank
    // NOTE: В реальной реализации нужно будет интегрировать с T-bank API
    // Для демонстрации просто покажем SnackBar
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Подтверждение оплаты'),
          content: Text('Вы хотите оплатить штраф на сумму ${amount.toStringAsFixed(2)} ₽?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Закрыть диалог
              },
              child: const Text('Отмена'),
            ),
            ElevatedButton(
              onPressed: () async {
                // Здесь будет вызов T-bank API для оплаты
                // Пока просто показываем сообщение
                Navigator.of(context).pop(); // Закрыть диалог

                // Демонстрация успешной оплаты
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Штраф на сумму ${amount.toStringAsFixed(2)} ₽ оплачен!'),
                    backgroundColor: Colors.green,
                  ),
                );

                // Обновляем список штрафов
                _loadFines();
              },
              child: const Text('Оплатить'),
            ),
          ],
        );
      },
    );
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Ожидает оплаты';
      case 'paid':
        return 'Оплачен';
      case 'cancelled':
        return 'Отменён';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'paid':
        return Colors.green;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _getTypeText(String type) {
    switch (type.toLowerCase()) {
      case 'station_return_violation':
        return 'Нарушение возврата на станцию';
      case 'vehicle_damage':
        return 'Повреждение транспорта';
      case 'late_return':
        return 'Опоздание с возвратом';
      case 'other':
        return 'Прочее';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Штрафы'),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : fines.isEmpty
              ? const Center(
                  child: Text(
                    'У вас нет штрафов',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadFines,
                  child: ListView.builder(
                    itemCount: fines.length,
                    itemBuilder: (context, index) {
                      final fine = fines[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Flexible(
                                    child: Text(
                                      _getTypeText(fine['type']),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(fine['status']),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      _getStatusText(fine['status']),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Сумма: ${double.parse(fine['amount'].toString()).toStringAsFixed(2)} ₽',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Дата создания: ${DateTime.parse(fine['created_at']).toString().split('.')[0]}',
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              ),
                              if (fine['due_date'] != null)
                                Text(
                                  'Срок оплаты: ${DateTime.parse(fine['due_date']).toString().split('.')[0]}',
                                  style: const TextStyle(
                                    color: Colors.orange,
                                    fontSize: 12,
                                  ),
                                ),
                              const SizedBox(height: 8),
                              if (fine['description'] != null && fine['description'].isNotEmpty)
                                Text(
                                  fine['description'],
                                  style: const TextStyle(
                                    color: Colors.grey,
                                  ),
                                ),
                              const SizedBox(height: 12),
                              // 7.5.3. Добавить кнопку «Оплатить штраф» → T-bank
                              if (fine['status'] == 'PENDING')
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: ElevatedButton(
                                    onPressed: () => _payFine(fine['id'], double.parse(fine['amount'].toString())),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.green,
                                      foregroundColor: Colors.white,
                                    ),
                                    child: const Text('Оплатить штраф'),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}