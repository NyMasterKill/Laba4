import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'screens/app_shell.dart';
import 'admin/admin_screen.dart';

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
        home: const RoleBasedHome(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class RoleBasedHome extends StatefulWidget {
  const RoleBasedHome({super.key});

  @override
  State<RoleBasedHome> createState() => _RoleBasedHomeState();
}

class _RoleBasedHomeState extends State<RoleBasedHome> {
  // В реальном приложении это значение будет зависеть от роли пользователя
  bool isAdmin = false; // по умолчанию - обычный пользователь

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Laba4 Flutter App'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.red,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.admin_panel_settings),
            onSelected: (String choice) {
              if (choice == 'toggle_admin') {
                setState(() {
                  isAdmin = !isAdmin;
                });
              }
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              PopupMenuItem<String>(
                value: 'toggle_admin',
                child: Text(isAdmin ? 'Выйти из админ-панели' : 'Войти в админ-панель'),
              ),
            ],
          ),
        ],
      ),
      body: isAdmin ? const AdminScreen() : const AppShell(),
    );
  }
}

class AppProvider extends ChangeNotifier {
  int _selectedIndex = 0;
  bool _isTechStaff = false; // по умолчанию - обычный пользователь

  int get selectedIndex => _selectedIndex;
  bool get isTechStaff => _isTechStaff;

  void updateIndex(int index) {
    _selectedIndex = index;
    notifyListeners();
  }

  void updateTechStaffStatus(bool isTechStaff) {
    _isTechStaff = isTechStaff;
    notifyListeners();
  }
}