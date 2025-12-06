import { Request, Response } from 'express';
import { GosuslugiService } from '../services/GosuslugiService';
import { UserService } from '../services/UserService';

export class GosuslugiController {
  private gosuslugiService: GosuslugiService;
  private userService: UserService;

  constructor() {
    this.gosuslugiService = new GosuslugiService();
    this.userService = new UserService();
  }

  async initiateAuth(req: Request, res: Response): Promise<void> {
    try {
      const authUrl = await this.gosuslugiService.getAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error('Error initiating Gosuslugi auth:', error);
      res.status(500).json({ message: 'Failed to initiate Gosuslugi authentication' });
    }
  }

  async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;

      if (!code) {
        res.status(400).json({ message: 'Authorization code is missing' });
        return;
      }

      // Exchange code for tokens
      const tokens = await this.gosuslugiService.exchangeCodeForToken(code as string);

      // Get user info from Gosuslugi using access token
      const userInfo = await this.gosuslugiService.getUserInfo(tokens.access_token);

      // Validate user age (should be 14 or older)
      if (!(await this.gosuslugiService.validateAge(userInfo))) {
        res.status(400).json({ message: 'User must be at least 14 years old' });
        return;
      }

      // Check if user exists by gosuslugi_id
      let existingUser = await this.userService.findByGosuslugiId(userInfo.id);

      if (existingUser) {
        // User already exists, just update binding info
        await this.userService.updateGosuslugiBinding(existingUser.id, {
          email: userInfo.email,
          phone: userInfo.phone,
          isVerified: true
        });

        // Generate JWT tokens
        const { accessToken, refreshToken } = await this.userService.generateTokens(existingUser.id);

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return access token
        res.status(200).json({
          accessToken,
          user: {
            id: existingUser.id,
            gosuslugi_id: existingUser.gosuslugi_id,
            email: userInfo.email,
            phone: userInfo.phone,
            first_name: userInfo.firstName,
            last_name: userInfo.lastName
          }
        });
      } else {
        // Create new user with basic info
        const newUser = await this.userService.createUserWithProfileAndBinding({
          gosuslugiId: userInfo.id,
          email: userInfo.email,
          phone: userInfo.phone,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          middleName: userInfo.middleName,
          birthDate: userInfo.birthDate,
          passportNumber: userInfo.passportSeriesNumber // Simplified as passport number
        });

        // Generate JWT tokens
        const { accessToken, refreshToken } = await this.userService.generateTokens(newUser.id);

        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return access token
        res.status(200).json({
          accessToken,
          user: {
            id: newUser.id,
            gosuslugi_id: newUser.gosuslugi_id,
            email: userInfo.email,
            phone: userInfo.phone,
            first_name: userInfo.firstName,
            last_name: userInfo.lastName
          }
        });
      }
    } catch (error) {
      console.error('Error handling Gosuslugi callback:', error);
      res.status(500).json({ message: 'Failed to handle Gosuslugi callback' });
    }
  }

  async refreshTokens(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token is missing' });
        return;
      }

      const userId = await this.userService.getUserIdByRefreshToken(refreshToken);

      if (!userId) {
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
      }

      const { accessToken, refreshToken: newRefreshToken } = await this.userService.generateTokens(userId);

      // Set new refresh token in HTTP-only cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({ accessToken });
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      res.status(500).json({ message: 'Failed to refresh tokens' });
    }
  }
}