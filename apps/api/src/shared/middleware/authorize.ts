import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../../config/redis';
import { prisma } from '../../config/database';
import { AppError } from '../utils/app-error';

/**
 * RBAC middleware factory.
 * Usage: router.get('/', authenticate, authorize('reservations', 'read'), controller)
 */
export function authorize(resource: string, action: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) return next(new AppError('Authentication required', 401));

    const { role } = req.user;
    const cacheKey = `permissions:role:${role}`;

    try {
      // Try cache first
      let permissions = await getCache<string[]>(cacheKey);

      if (!permissions) {
        // Load from DB
        const roleRecord = await prisma.role.findFirst({
          where: { name: role },
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        });

        if (!roleRecord) return next(new AppError('Role not found', 403));

        permissions = roleRecord.rolePermissions.map(
          (rp) => `${rp.permission.resource}:${rp.permission.action}`
        );

        // Cache for 10 minutes
        await setCache(cacheKey, permissions, 600);
      }

      const required = `${resource}:${action}`;
      if (!permissions.includes(required)) {
        return next(new AppError(`Forbidden: missing permission "${required}"`, 403));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
