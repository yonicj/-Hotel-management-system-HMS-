import { Request, Response, NextFunction } from 'express';
import * as service from './rate-plans.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export async function getRatePlans(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getRatePlans(req.user!.hotelId)); } catch (e) { next(e); }
}
export async function createRatePlan(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await service.createRatePlan(req.user!.hotelId, req.body), 'Rate plan created'); } catch (e) { next(e); }
}
export async function updateRatePlan(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.updateRatePlan(req.params.id, req.body), 'Rate plan updated'); } catch (e) { next(e); }
}
export async function computeRate(req: Request, res: Response, next: NextFunction) {
  try {
    const { room_type_id, check_in, check_out } = req.query as Record<string, string>;
    sendSuccess(res, await service.computeRate(room_type_id, check_in, check_out));
  } catch (e) { next(e); }
}
