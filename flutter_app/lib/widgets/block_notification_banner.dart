import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config.dart';
import '../services/auth_service.dart';

class BlockNotificationBanner extends StatefulWidget {
  final Widget child;
  
  const BlockNotificationBanner({
    super.key, 
    required this.child
  });

  @override
  _BlockNotificationBannerState createState() => _BlockNotificationBannerState();
}

class _BlockNotificationBannerState extends State<BlockNotificationBanner> {
  bool _isBlocked = false;
  List<dynamic> _unpaidFines = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkForBlockingConditions();
  }

  Future<void> _checkForBlockingConditions() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final token = await AuthService().getToken();
      final userId = await AuthService().getUserId();

      // Проверяем наличие неоплаченных штрафов
      final response = await http.get(
        Uri.parse('${Config.apiUrl}/users/$userId/check-block-status'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _isBlocked = data['is_blocked'] ?? false;
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
    return Stack(
      children: [
        widget.child,
        if (_isBlocked && !_isLoading)
          Positioned(
            top: kToolbarHeight, // Размещаем под AppBar
            left: 0,
            right: 0,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              color: Colors.red[700],
              child: Row(
                children: [
                  const Icon(Icons.block, color: Colors.white),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Внимание! Доступ ограничен',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'У вас есть неоплаченные штрафы. Оплатите штрафы, чтобы восстановить доступ.',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () {
                      // Скрываем баннер, но проверка будет снова при обновлении
                    },
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}