import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../main.dart';
import 'map_screen.dart';
import 'profile_screen.dart';
import 'support_screen.dart';
import 'subscriptions_screen.dart';
import 'fines_screen.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          body: IndexedStack(
            index: appProvider.selectedIndex,
            children: const [
              MapScreen(),
              FinesScreen(), // 7.5.2. Создать экран «Штрафы» (список, статусы)
              ProfileScreen(),
              SupportScreen(),
              SubscriptionsScreen(),
            ],
          ),
          bottomNavigationBar: BottomNavigationBar(
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.black,
            selectedItemColor: Colors.red,
            unselectedItemColor: Colors.grey,
            currentIndex: appProvider.selectedIndex,
            onTap: (index) {
              appProvider.updateIndex(index);
            },
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.map),
                label: 'Карта',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.warning),
                label: 'Штрафы',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person),
                label: 'Профиль',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.support),
                label: 'Поддержка',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.subscriptions),
                label: 'Подписки',
              ),
            ],
          ),
        );
      },
    );
  }
}