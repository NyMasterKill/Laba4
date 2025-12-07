import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/vehicle.dart'; // Предположим, что там есть `status` и `id`
import '../config.dart'; // Где-то хранится базовый URL

class BookingService {
  static const String _baseUrl = AppConfig.apiBaseUrl; // предполагаем, что это определено

  static Future<Map<String, dynamic>?> createBooking(String vehicleId) async {
    final url = Uri.parse('$_baseUrl/api/bookings'); // Используем базовый URL из конфига
    final token = await _getAuthToken(); // Получаем токен из хранилища (SharedPrefs или иное)

    if (token == null) {
      print('No auth token found.');
      return null; // Пользователь не авторизован
    }

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token', // Передаём токен в заголовке
        },
        body: jsonEncode({'vehicleId': vehicleId}), // Тело запроса
      );

      if (response.statusCode == 201) {
        // Бронь создана успешно
        final bookingData = json.decode(response.body);
        print('Booking created: ${bookingData['id']}');
        return bookingData; // Возвращаем данные брони, если нужно
      } else {
        print('Failed to create booking: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error creating booking: $e');
      return null;
    }
  }

  // Заглушка для получения токена. В реальности, это будет из SecureStore или SharedPrefs.
  static Future<String?> _getAuthToken() async {
    // Тут будет логика получения токена, например:
    // final prefs = await SharedPreferences.getInstance();
    // return prefs.getString('access_token');
    print('_getAuthToken called - implement token retrieval from storage');
    return 'FAKE_TOKEN_IF_IMPLEMENTED'; // Заглушка
  }
}