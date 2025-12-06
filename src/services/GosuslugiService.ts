import axios from 'axios';
import { User } from '../entities/User';
import { Profile } from '../entities/Profile';
import { GosuslugiBinding } from '../entities/GosuslugiBinding';
import { AppDataSource } from '../config/typeorm.config';

export interface GosuslugiUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  snils?: string;
  inn?: string;
  passportSeriesNumber?: string;
  address?: string;
  age?: number;
}

export interface GosuslugiOAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export class GosuslugiService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authorizationUrl: string;
  private tokenUrl: string;
  private userInfoUrl: string;

  constructor() {
    this.clientId = process.env.GOSUSLUGI_CLIENT_ID || '';
    this.clientSecret = process.env.GOSUSLUGI_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOSUSLUGI_REDIRECT_URI || '';
    this.authorizationUrl = process.env.GOSUSLUGI_AUTH_URL || 'https://esia.gosuslugi.ru/aas/oauth2/ac';
    this.tokenUrl = process.env.GOSUSLUGI_TOKEN_URL || 'https://esia.gosuslugi.ru/aas/oauth2/rt';
    this.userInfoUrl = process.env.GOSUSLUGI_USERINFO_URL || 'https://esia.gosuslugi.ru/rs/prns';
  }

  async getAuthUrl(): Promise<string> {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'fullname email',
      state: state
    });

    return `${this.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<GosuslugiOAuthTokens> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code: code
    });

    try {
      const response = await axios.post(this.tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to authenticate with Gosuslugi');
    }
  }

  async getUserInfo(accessToken: string): Promise<GosuslugiUserInfo> {
    try {
      const response = await axios.get(`${this.userInfoUrl}?access_token=${accessToken}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = response.data;
      return {
        id: data.id,
        firstName: data.firstName || data.first_name || '',
        lastName: data.lastName || data.last_name || '',
        middleName: data.middleName || data.middle_name,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate,
        snils: data.snils,
        inn: data.inn,
        passportSeriesNumber: data.passportSeriesNumber,
        address: data.address,
        age: data.age
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user information from Gosuslugi');
    }
  }

  async validateAge(user: GosuslugiUserInfo): Promise<boolean> {
    if (!user.birthDate) {
      return false;
    }

    const birthDate = new Date(user.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Возраст должен быть не менее 14 лет
    return age >= 14;
  }
}