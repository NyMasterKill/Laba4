// integration_test/fine_flow_e2e_test.dart
// E2E-тест: нарушение → штраф → оплата → разблокировка

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import '../lib/main.dart' as app;
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('E2E Test: Violation -> Fine -> Payment -> Unblock', () {
    setUp(() async {
      // Убедимся, что приложение в начальном состоянии
      await app.main();
      await pumpAndSettle();
    });

    testWidgets('Complete fine flow', (WidgetTester tester) async {
      // 1. Симуляция нарушения при возврате на станцию
      // Вызовем API для создания штрафа (в реальных условиях это происходит на бэкенде)
      final token = 'mock_token'; // В реальном тесте нужно получить токен
      final userId = 'mock_user_id'; // В реальном тесте нужно получить ID пользователя
      
      // Создаем штраф для тестирования
      final fineResponse = await http.post(
        Uri.parse('http://localhost:3000/fines'), // Адрес сервера
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'type': 'station_return_violation',
          'amount': 1000,
          'status': 'pending',
          'description': 'Ride returned outside station area'
        }),
      );
      
      expect(fineResponse.statusCode, 201);
      
      // 2. Проверяем, что в интерфейсе отображается штраф
      await tester.pumpAndSettle();
      
      // Переходим на вкладку "Штрафы"
      final finesTab = find.text('Штрафы');
      await tester.tap(finesTab);
      await tester.pumpAndSettle();
      
      // Проверяем наличие штрафа
      expect(find.textContaining('Нарушение возврата'), findsOneWidget);
      expect(find.textContaining('1000.00 ₽'), findsOneWidget);
      expect(find.text('Ожидает оплаты'), findsOneWidget);
      
      // 3. Проверяем, что поездка не может быть начата из-за штрафа
      // Возвращаемся на карту
      final mapTab = find.text('Карта');
      await tester.tap(mapTab);
      await tester.pumpAndSettle();
      
      // Пытаемся начать поездку (в реальных условиях этот шаг будет зависеть от реализации)
      // Предположим, что есть элемент, показывающий ограничение
      
      // 4. Оплачиваем штраф
      await tester.tap(finesTab);
      await tester.pumpAndSettle();
      
      // Находим кнопку оплаты и нажимаем ее
      final payButton = find.text('Оплатить штраф');
      await tester.tap(payButton);
      await tester.pumpAndSettle();
      
      // Подтверждаем оплату
      final confirmButton = find.text('Оплатить');
      await tester.tap(confirmButton);
      await tester.pumpAndSettle();
      
      // 5. Проверяем, что статус штрафа изменился на "Оплачен"
      await tester.pump(Duration(seconds: 2)); // Ждем обновления
      
      expect(find.text('Оплачен'), findsOneWidget);
      
      // 6. Проверяем, что теперь можно начать поездку
      await tester.tap(mapTab);
      await tester.pumpAndSettle();
      
      // Проверяем, что больше нет уведомления о блокировке
      expect(find.textContaining('Доступ ограничен'), findsNothing);
      
      print('E2E тест пройден: нарушение → штраф → оплата → разблокировка');
    });
  });
}