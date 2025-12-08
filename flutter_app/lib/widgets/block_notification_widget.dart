import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';
import '../services/auth_service.dart';

class BlockNotificationWidget extends StatefulWidget {
  const BlockNotificationWidget({super.key});

  @override
  _BlockNotificationWidgetState createState() => _BlockNotificationWidgetState();
}

class _BlockNotificationWidgetState extends State<BlockNotificationWidget> {
  bool _isLoading = true;
  bool _hasUnpaidFines = false;
  List<dynamic> _unpaidFines = [];

  @override
  void initState() {
    super.initState();
    _checkForUnpaidFines();
  }

  Future<void> _checkForUnpaidFines() async {
    try {
      final token = await AuthService().getToken();
      final userId = await AuthService().getUserId();

      // API endpoint для проверки неоплаченных штрафов - в реальности может отличаться
      final response = await http.get(
        Uri.parse('${Config.apiUrl}/fines/user/$userId/unpaid'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _hasUnpaidFines = data['has_unpaid_fines'] ?? false;
          _unpaidFines = data['unpaid_fines'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(); // Не показываем ничего во время загрузки
    }

    if (!_hasUnpaidFines) {
      return Container(); // Не показываем ничего, если нет штрафов
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      color: Colors.red,
      child: Row(
        children: [
          const Icon(Icons.warning, color: Colors.white),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Внимание! Доступ ограничен',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'У вас есть неоплаченные штрафы (${_unpaidFines.length}). Оплатите штрафы, чтобы восстановить доступ.',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 16),
            onPressed: () {
              // Переход на экран штрафов
              Navigator.pushNamed(context, '/fines'); // или другой способ навигации
            },
          ),
        ],
      ),
    );
  }
}