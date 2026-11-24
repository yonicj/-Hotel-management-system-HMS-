import { Request, Response, NextFunction } from 'express';
import * as service from './reservations.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export async function getReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const { reservations, pagination } = await service.getReservations(
      req.user!.hotelId, req.query as any, req.query.page, req.query.limit
    );
    sendPaginated(res, reservations, pagination);
  } catch (e) { next(e); }
}
export async function getReservationById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getReservationById(req.params.id)); } catch (e) { next(e); }
}
export async function createReservation(req: Request, res: Response, next: NextFunction) {
  try {
    sendCreated(res,
      await service.createReservation(req.user!.hotelId, req.body, req.user!.userId),
      'Reservation created'
    );
  } catch (e) { next(e); }
}
export async function modifyReservation(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(
      res,
      await service.modifyReservation(req.params.id, req.body, req.user!.userId),
      'Reservation updated'
    );
  } catch (e) { next(e); }
}
export async function confirmReservation(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.confirmReservation(req.params.id, req.user!.userId), 'Reservation confirmed');
  } catch (e) { next(e); }
}
export async function cancelReservation(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.cancelReservation(req.params.id, req.user!.userId), 'Reservation cancelled');
  } catch (e) { next(e); }
}
export async function assignRoom(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.assignRoom(req.params.id, req.body.roomId, req.user!.userId), 'Room assigned');
  } catch (e) { next(e); }
}
