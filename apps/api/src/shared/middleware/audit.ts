import { Request, Response, NextFunction } from 'express';
import { recordAuditLog } from '../utils/audit';

declare global {
  namespace Express {
    interface Request {
      recordAudit?: (
        action: string,
        entityType: string,
        entityId: string,
        changes?: Record<string, any>
      ) => Promise<any>;
    }
  }
}

export function auditMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.recordAudit = async (
    action: string,
    entityType: string,
    entityId: string,
    changes?: Record<string, any>
  ) => {
    const userId = req.user?.userId || 'system';
    return recordAuditLog({
      userId,
      action,
      entityType,
      entityId,
      changes,
    });
  };
  next();
}
