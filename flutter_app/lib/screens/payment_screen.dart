import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';
import '../services/auth_service.dart';
import 'subscriptions_screen.dart';

class PaymentScreen extends StatefulWidget {
  final Subscription subscription;
  final VoidCallback? onPaymentSuccess;

  const PaymentScreen({
    Key? key,
    required this.subscription,
    this.onPaymentSuccess,
  }) : super(key: key);

  @override
  _PaymentScreenState createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _isLoading = false;

  Future<void> _initPayment() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final token = await AuthService().getToken();

      final response = await http.post(
        Uri.parse('${Config.apiUrl}/payments/init'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'amount': widget.subscription.tariffPlan.price,
          'description': 'Оплата подписки "${widget.subscription.tariffPlan.name}"',
          'user_id': await AuthService().getUserId(),
        }),
      );

      if (response.statusCode == 201) {
        final paymentData = jsonDecode(response.body);
        
        // В реальной реализации здесь будет вызов платежного SDK или открытие WebView
        // для оплаты через T-bank
        
        print('Payment initialized: ${paymentData['session_id']}');
        
        // Моковая оплата - сразу считаем что прошла успешно
        _simulatePaymentSuccess();
      } else {
        final errorData = jsonDecode(response.body);
        print('Failed to init payment: ${errorData['error']}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка инициализации оплаты: ${errorData['error']}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      print('Error initializing payment: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Ошибка сети при инициализации оплаты'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _simulatePaymentSuccess() {
    // Моковая функция для симуляции успешной оплаты
    // В реальной реализации здесь будет обработка результата от платежной системы
    widget.onPaymentSuccess?.call();
    
    Navigator.pop(context); // Возвращаемся на предыдущий экран
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Подписка успешно оплачена!'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Оплата подписки'),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.subscription.tariffPlan.name,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(widget.subscription.tariffPlan.description),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Стоимость:',
                          style: TextStyle(
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          '${widget.subscription.tariffPlan.price} ₽',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Бесплатные минуты:',
                          style: TextStyle(
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          '${widget.subscription.tariffPlan.freeMinutes} мин',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Способ оплаты',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    RadioListTile<int>(
                      title: const Text('Банковская карта'),
                      value: 1,
                      groupValue: 1,
                      onChanged: (value) {},
                    ),
                    RadioListTile<int>(
                      title: const Text('T-Bank'),
                      value: 2,
                      groupValue: 1,
                      onChanged: (value) {},
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _initPayment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'Оплатить',
                        style: TextStyle(fontSize: 18),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}