import 'package:flutter/material.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _middleNameController = TextEditingController();
  final TextEditingController _birthDateController = TextEditingController();
  final TextEditingController _passportController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Регистрация'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Регистрация нового пользователя',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: 'Номер телефона',
                  prefixText: '+7',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _firstNameController,
                decoration: const InputDecoration(
                  labelText: 'Имя',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _lastNameController,
                decoration: const InputDecoration(
                  labelText: 'Фамилия',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _middleNameController,
                decoration: const InputDecoration(
                  labelText: 'Отчество',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _birthDateController,
                decoration: const InputDecoration(
                  labelText: 'Дата рождения',
                  hintText: 'ДД.ММ.ГГГГ',
                  border: OutlineInputBorder(),
                ),
                readOnly: true,
                onTap: () {
                  _selectBirthDate(context);
                },
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passportController,
                decoration: const InputDecoration(
                  labelText: 'Серия и номер паспорта',
                  hintText: '1234 567890',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  _registerUser();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text(
                  'Зарегистрироваться',
                  style: TextStyle(fontSize: 16),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const Text('Уже есть аккаунт? Войти'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _selectBirthDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      _birthDateController.text = "${picked.day.toString().padLeft(2, '0')}.${picked.month.toString().padLeft(2, '0')}.${picked.year}";
    }
  }

  void _registerUser() {
    // TODO: Реализовать логику регистрации
    print('Registering user:');
    print('- Phone: ${_phoneController.text}');
    print('- First Name: ${_firstNameController.text}');
    print('- Last Name: ${_lastNameController.text}');
    print('- Middle Name: ${_middleNameController.text}');
    print('- Birth Date: ${_birthDateController.text}');
    print('- Passport: ${_passportController.text}');

    // Проверяем возраст (должно быть не менее 14 лет)
    if (_birthDateController.text.isNotEmpty) {
      final birthDateParts = _birthDateController.text.split('.');
      if (birthDateParts.length == 3) {
        try {
          final birthDate = DateTime(
            int.parse(birthDateParts[2]),
            int.parse(birthDateParts[1]),
            int.parse(birthDateParts[0]),
          );
          
          final today = DateTime.now();
          int age = today.year - birthDate.year;
          if (today.month < birthDate.month || 
              (today.month == birthDate.month && today.day < birthDate.day)) {
            age--;
          }
          
          if (age < 14) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Пользователю должно быть не менее 14 лет')),
            );
            return;
          }
        } catch (e) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Неверный формат даты рождения')),
          );
          return;
        }
      }
    }

    // TODO: Вызвать API для регистрации
    // После успешной регистрации, можно перенаправить на экран ввода кода 2FA
    Navigator.pushNamed(context, '/verification');
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _middleNameController.dispose();
    _birthDateController.dispose();
    _passportController.dispose();
    super.dispose();
  }
}