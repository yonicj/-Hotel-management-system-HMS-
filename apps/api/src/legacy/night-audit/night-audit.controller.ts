import { Request, Response, NextFunction } from 'express';
import * as service from './night-audit.service';
import { sendSuccess } from '../../shared/utils/response';

export async function getNightAuditStatus(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getNightAuditStatus(req.user!.hotelId)); } catch (e) { next(e); }
}
export async function runNightAudit(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.runNightAudit(req.user!.hotelId, req.user!.userId), 'Night audit completed'); } catch (e) { next(e); }
}
export async function getNightAuditHistory(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getNightAuditHistory(req.user!.hotelId)); } catch (e) { next(e); }
}
