import { Request, Response } from 'express';
import { TwoFactorAuthService } from '../services/TwoFactorAuthService';
import { UserService } from '../services/UserService';

export class TwoFactorAuthController {
  private twoFactorAuthService: TwoFactorAuthService;
  private userService: UserService;

  constructor() {
    this.twoFactorAuthService = new TwoFactorAuthService();
    this.userService = new UserService();
  }

  // Эндпоинт для запроса 2FA кода
  async request2FACode(req: Request, res: Response): Promise<void> {
    try {
      const { phone, email, method } = req.body;

      if (!phone && !email) {
        res.status(400).json({ message: 'Phone number or email is required' });
        return;
      }

      let destination = phone || email;
      let verificationType = phone ? VerificationType.SMS : VerificationType.EMAIL;

      if (method) {
        // Если указан конкретный метод 2FA
        verificationType = method === 'email' ? VerificationType.EMAIL : VerificationType.SMS;
        destination = method === 'email' ? email : phone;
      }

      if (!destination) {
        res.status(400).json({ message: 'Destination for 2FA code is required' });
        return;
      }

      // Находим пользователя
      const user = await this.userService.findByPhoneOrEmail(destination);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Генерируем код подтверждения
      const verificationCode = await this.twoFactorAuthService.generateVerificationCode(
        user.id,
        destination,
        VerificationType.TWO_FACTOR_AUTH
      );

      // Отправляем код пользователю
      if (verificationType === VerificationType.SMS) {
        await this.twoFactorAuthService.sendSMSVerificationCode(destination, verificationCode.code);
      } else {
        await this.twoFactorAuthService.sendEmailVerificationCode(destination, verificationCode.code);
      }

      res.status(200).json({ message: '2FA code sent successfully' });
    } catch (error) {
      console.error('Request 2FA code error:', error);
      res.status(500).json({ message: 'Failed to send 2FA code' });
    }
  }

  // Эндпоинт для проверки 2FA кода
  async verify2FACode(req: Request, res: Response): Promise<void> {
    try {
      const { userId, code } = req.body;

      if (!userId || !code) {
        res.status(400).json({ message: 'User ID and code are required' });
        return;
      }

      // Проверяем код
      const isValid = await this.twoFactorAuthService.verifyCode(
        userId,
        code,
        VerificationType.TWO_FACTOR_AUTH
      );

      if (!isValid) {
        res.status(400).json({ message: 'Invalid or expired 2FA code' });
        return;
      }

      // Генерируем JWT токены
      const { accessToken, refreshToken } = await this.userService.generateTokens(userId);

      // Устанавливаем refresh токен в cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
      });

      // Возвращаем access токен
      res.status(200).json({
        success: true,
        message: '2FA verification successful',
        accessToken
      });
    } catch (error) {
      console.error('Verify 2FA code error:', error);
      res.status(500).json({ message: 'Failed to verify 2FA code' });
    }
  }
}