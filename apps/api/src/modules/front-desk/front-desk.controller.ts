import { Request, Response, NextFunction } from 'express';
import * as service from './front-desk.service';
import { sendSuccess } from '../../shared/utils/response';
import { today } from '@hms/shared-utils';

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.checkIn(req.params.reservationId, req.user!.userId), 'Guest checked in'); } catch (e) { next(e); }
}
export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.checkOut(req.params.reservationId, req.user!.userId), 'Guest checked out'); } catch (e) { next(e); }
}
export async function getArrivals(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getArrivals(req.user!.hotelId, (req.query.date as string) || today())); } catch (e) { next(e); }
}
export async function getDepartures(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getDepartures(req.user!.hotelId, (req.query.date as string) || today())); } catch (e) { next(e); }
}
export async function getInHouse(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getInHouse(req.user!.hotelId)); } catch (e) { next(e); }
}
export async function getRoomRack(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getRoomRack(req.user!.hotelId)); } catch (e) { next(e); }
}
