import { Request, Response, NextFunction } from 'express';
import { Permission, ROLES } from '@ehms/config';
import { ErrorCode } from '@ehms/types';
import { getCache, setCache } from '../../config/redis';
import { prisma } from '../../config/database';
import { AppError } from '../utils/app-error';

/**
 * RBAC middleware factory.
 * Usage:
 *   router.get('/', authenticate, authorize(PERMISSIONS.RESERVATIONS_READ), controller)
 *   // Legacy signature:
 *   router.get('/', authenticate, authorize('reservations', 'read'), controller)
 */
export function authorize(permissionOrResource: Permission | string, action?: string) {
  const required = action ? `${permissionOrResource}:${action}` : permissionOrResource;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, ErrorCode.UNAUTHORIZED));
    }

    const { role } = req.user;

    // Super Admin has full system access across all resources
    if (role === ROLES.SUPER_ADMIN || role === 'SUPER_ADMIN' || role === 'admin') {
      return next();
    }

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

        if (!roleRecord) {
          return next(new AppError('Role not found', 403, ErrorCode.FORBIDDEN));
        }

        permissions = roleRecord.rolePermissions.map(
          (rp: any) => `${rp.permission.resource}:${rp.permission.action}`
        );

        // Cache for 10 minutes
        await setCache(cacheKey, permissions, 600);
      }

      if (!permissions.includes(required)) {
        return next(
          new AppError(`Forbidden: missing permission "${required}"`, 403, ErrorCode.FORBIDDEN)
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
