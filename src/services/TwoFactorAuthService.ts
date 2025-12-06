import { Repository } from 'typeorm';
import { VerificationCode, VerificationType } from '../entities/VerificationCode';
import { AppDataSource } from '../config/typeorm.config';
import { User } from '../entities/User';
import crypto from 'crypto';

export class TwoFactorAuthService {
  private verificationCodeRepository: Repository<VerificationCode>;

  constructor() {
    this.verificationCodeRepository = AppDataSource.getRepository(VerificationCode);
  }

  async generateVerificationCode(
    userId: string,
    destination: string,
    type: VerificationType,
    expirationMinutes: number = 10
  ): Promise<VerificationCode> {
    // Удаляем предыдущие неиспользованные коды для этого пользователя и типа
    await this.verificationCodeRepository.delete({
      user: { id: userId },
      type,
      is_used: false,
      expires_at: () => 'expires_at > NOW()'
    });

    // Генерируем 6-значный код
    const code = this.generateSixDigitCode();

    // Создаем новый код подтверждения
    const verificationCode = new VerificationCode();
    verificationCode.type = type;
    verificationCode.destination = destination;
    verificationCode.code = code;
    verificationCode.expires_at = new Date(Date.now() + expirationMinutes * 60 * 1000); // экспирация через N минут
    verificationCode.user = { id: userId } as User; // используем только ID

    return await this.verificationCodeRepository.save(verificationCode);
  }

  async verifyCode(userId: string, code: string, type: VerificationType): Promise<boolean> {
    const now = new Date();

    // Находим код подтверждения
    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        user: { id: userId },
        code,
        type,
        is_used: false,
        expires_at: () => 'expires_at > NOW()'
      }
    });

    if (!verificationCode) {
      return false; // Код не найден, просрочен или уже использован
    }

    // Помечаем код как использованный
    verificationCode.is_used = true;
    await this.verificationCodeRepository.save(verificationCode);

    return true;
  }

  async sendSMSVerificationCode(phoneNumber: string, code: string): Promise<void> {
    // Здесь будет интеграция с SMS-провайдером (например, Twilio, SMS.ru, и т.д.)
    console.log(`Sending SMS verification code ${code} to ${phoneNumber}`);
    
    // В реальной реализации здесь будет вызов API провайдера SMS-сообщений
    // Пример: await twilioClient.messages.create({...})
  }

  async sendEmailVerificationCode(email: string, code: string): Promise<void> {
    // Здесь будет интеграция с email-провайдером (например, SendGrid, AWS SES, и т.д.)
    console.log(`Sending Email verification code ${code} to ${email}`);
    
    // В реальной реализации здесь будет вызов API провайдера email-сообщений
    // Пример: await sendgrid.send({...})
  }

  private generateSixDigitCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }
}