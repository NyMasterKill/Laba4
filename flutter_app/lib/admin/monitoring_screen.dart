import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class MonitoringScreen extends StatefulWidget {
  const MonitoringScreen({Key? key}) : super(key: key);

  @override
  State<MonitoringScreen> createState() => _MonitoringScreenState();
}

class _MonitoringScreenState extends State<MonitoringScreen> {
  @override
  void initState() {
    super.initState();
    // Enable virtual display for webview
    if (WebView.platform == null) {
      WebView.platform = SurfaceAndroidWebView();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Мониторинг'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.red,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Активные пользователи: 1247',
              style: TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 16),
            const Text(
              'Активные поездки: 89',
              style: TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 16),
            const Text(
              'Доход за сегодня: 45 670 ₽',
              style: TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 16),
            const Text(
              'Средняя оценка: 4.7',
              style: TextStyle(fontSize: 18),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Card(
                child: WebView(
                  javascriptMode: JavascriptMode.unrestricted,
                  initialUrl: 'https://grafana.example.com/dashboards', // Заменить на реальный URL
                  onPageStarted: (String url) {
                    // Обработка начала загрузки страницы
                  },
                  onPageFinished: (String url) {
                    // Обработка окончания загрузки страницы
                  },
                  onWebResourceError: (WebResourceError error) {
                    // Обработка ошибок загрузки
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}