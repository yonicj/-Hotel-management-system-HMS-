import { Request, Response, NextFunction } from 'express';
import * as service from './reports.service';
import { sendSuccess } from '../../shared/utils/response';
import { today } from '@hms/shared-utils';

export async function getOccupancyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as Record<string, string>;
    sendSuccess(res, await service.getOccupancyReport(req.user!.hotelId, from, to));
  } catch (e) { next(e); }
}
export async function getRevenueReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as Record<string, string>;
    sendSuccess(res, await service.getRevenueReport(req.user!.hotelId, from, to));
  } catch (e) { next(e); }
}
export async function getArrivalsDeparturesReport(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getArrivalsDeparturesReport(req.user!.hotelId, (req.query.date as string) || today()));
  } catch (e) { next(e); }
}
export async function getHousekeepingSummary(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getHousekeepingSummary(req.user!.hotelId, (req.query.date as string) || today()));
  } catch (e) { next(e); }
}
export async function getGuestLedger(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getGuestLedger(req.user!.hotelId)); } catch (e) { next(e); }
}
