import { Request, Response, NextFunction } from 'express';
import * as service from './audit-log.service';
import { sendSuccess } from '../../shared/utils/response';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(
      res,
      await service.getAuditLogs(
        req.query.entityType as string,
        req.query.entityId as string,
        req.query.action as string,
        req.query.userId as string
      )
    );
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogById(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getAuditLogById(req.params.id));
  } catch (err) {
    next(err);
  }
}
