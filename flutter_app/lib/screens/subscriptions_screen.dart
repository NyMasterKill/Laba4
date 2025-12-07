import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';
import '../services/auth_service.dart';

class SubscriptionPlan {
  final String id;
  final String name;
  final String description;
  final double price;
  final int freeMinutes;
  final bool isActive;

  SubscriptionPlan({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.freeMinutes,
    required this.isActive,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) {
    return SubscriptionPlan(
      id: json['id'],
      name: json['name'],
      description: json['description'] ?? '',
      price: double.tryParse(json['price'].toString()) ?? 0.0,
      freeMinutes: json['free_minutes'] ?? 0,
      isActive: json['is_active'] ?? false,
    );
  }
}

class Subscription {
  final String id;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final int usedMinutes;
  final SubscriptionPlan tariffPlan;

  Subscription({
    required this.id,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.usedMinutes,
    required this.tariffPlan,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: json['id'],
      status: json['status'],
      startDate: DateTime.parse(json['start_date']),
      endDate: DateTime.parse(json['end_date']),
      usedMinutes: json['used_minutes'] ?? 0,
      tariffPlan: SubscriptionPlan.fromJson(json['tariff_plan']),
    );
  }
}

class SubscriptionsScreen extends StatefulWidget {
  const SubscriptionsScreen({Key? key}) : super(key: key);

  @override
  _SubscriptionsScreenState createState() => _SubscriptionsScreenState();
}

class _SubscriptionsScreenState extends State<SubscriptionsScreen> {
  List<SubscriptionPlan> _plans = [];
  List<Subscription> _subscriptions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final token = await AuthService().getToken();

      // Загрузка тарифных планов
      final plansResponse = await http.get(
        Uri.parse('${Config.apiUrl}/tariffs'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (plansResponse.statusCode == 200) {
        final plansData = json.decode(plansResponse.body)['tariff_plans'] as List;
        _plans = plansData.map((json) => SubscriptionPlan.fromJson(json)).toList();
      } else {
        print('Failed to load tariff plans: ${plansResponse.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка загрузки тарифных планов')),
        );
      }

      // Загрузка подписок пользователя
      final subsResponse = await http.get(
        Uri.parse('${Config.apiUrl}/subscriptions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (subsResponse.statusCode == 200) {
        final subsData = json.decode(subsResponse.body)['subscriptions'] as List;
        _subscriptions = subsData.map((json) => Subscription.fromJson(json)).toList();
      } else {
        print('Failed to load subscriptions: ${subsResponse.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка загрузки подписок')),
        );
      }
    } catch (e) {
      print('Error loading data: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка сети при загрузке данных')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _purchaseSubscription(String planId) async {
    final token = await AuthService().getToken();

    final response = await http.post(
      Uri.parse('${Config.apiUrl}/subscriptions'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'tariff_plan_id': planId,
      }),
    );

    if (response.statusCode == 201) {
      final newSubscription = Subscription.fromJson(jsonDecode(response.body)['subscription']);
      setState(() {
        _subscriptions.add(newSubscription);
      });

      // Открытие экрана оплаты
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentScreen(
            subscription: newSubscription,
            onPaymentSuccess: () {
              // Обновляем данные после успешной оплаты
              _loadData();
            },
          ),
        ),
      );
    } else {
      final errorData = jsonDecode(response.body);
      print('Failed to create subscription: ${errorData['error']}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка при оформлении подписки: ${errorData['error']}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Подписки'),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Заголовок "Активные подписки"
                    if (_subscriptions.isNotEmpty) ...[
                      const Text(
                        'Ваши подписки',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ..._subscriptions.map((sub) => _buildSubscriptionCard(sub)).toList(),
                      const SizedBox(height: 16),
                    ],
                    
                    // Заголовок "Доступные тарифы"
                    const Text(
                      'Доступные тарифы',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ..._plans.map((plan) => _buildPlanCard(plan)).toList(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSubscriptionCard(Subscription subscription) {
    final now = DateTime.now();
    final isActive = subscription.status == 'active' && 
                   subscription.startDate.isBefore(now) && 
                   subscription.endDate.isAfter(now);
    
    Color statusColor = Colors.grey;
    String statusText = 'Неактивна';
    
    if (isActive) {
      statusColor = Colors.green;
      statusText = 'Активна';
    } else if (subscription.status == 'cancelled') {
      statusColor = Colors.orange;
      statusText = 'Отменена';
    } else if (subscription.status == 'expired') {
      statusColor = Colors.red;
      statusText = 'Просрочена';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    subscription.tariffPlan.name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusText,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(subscription.tariffPlan.description),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Стоимость: ${subscription.tariffPlan.price} ₽'),
                      Text('Бесплатные минуты: ${subscription.tariffPlan.freeMinutes}'),
                      Text('Использовано минут: ${subscription.usedMinutes}'),
                    ],
                  ),
                ),
                if (isActive) ...[
                  const SizedBox(width: 16),
                  ElevatedButton(
                    onPressed: () {
                      // Действие отмены подписки
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Отменить'),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Активна с ${_formatDate(subscription.startDate)} по ${_formatDate(subscription.endDate)}',
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard(SubscriptionPlan plan) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    plan.name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Text(
                  '${plan.price} ₽',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(plan.description),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text('Бесплатные минуты: ${plan.freeMinutes}'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: () => _purchaseSubscription(plan.id),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Оформить'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}