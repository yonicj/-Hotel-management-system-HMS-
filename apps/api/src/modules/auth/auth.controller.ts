import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../shared/utils/response';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    sendSuccess(
      res,
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await authService.refreshTokens(token);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    sendSuccess(res, result, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.token;
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    await authService.logout(req.user!.userId, accessToken, refreshToken);
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, req.user, 'Current user');
  } catch (err) {
    next(err);
  }
}
