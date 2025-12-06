import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'screens/app_shell.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => AppProvider(),
      child: MaterialApp(
        title: 'Laba4 Flutter App',
        theme: AppTheme.darkTheme,
        home: const AppShell(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class AppProvider extends ChangeNotifier {
  int _selectedIndex = 0;
  
  int get selectedIndex => _selectedIndex;
  
  void updateIndex(int index) {
    _selectedIndex = index;
    notifyListeners();
  }
}