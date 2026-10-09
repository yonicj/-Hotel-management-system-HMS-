import { Router } from 'express';
import { loginController, refreshController, logoutController, meController } from './auth.controller';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { authRateLimiter } from '../../shared/middleware/rate-limiter';
import { loginSchema, refreshSchema } from './auth.schema';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), loginController);
router.post('/refresh', validate(refreshSchema, 'body'), refreshController);
router.post('/logout', authenticate, logoutController);
router.get('/me', authenticate, meController);

export default router;
