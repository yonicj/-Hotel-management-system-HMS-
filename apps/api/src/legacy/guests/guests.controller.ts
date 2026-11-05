import { Request, Response, NextFunction } from 'express';
import * as guestsService from './guests.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export async function getGuests(req: Request, res: Response, next: NextFunction) {
  try {
    const { guests, pagination } = await guestsService.getGuests(req.query.search as string, req.query.page, req.query.limit);
    sendPaginated(res, guests, pagination);
  } catch (err) { next(err); }
}

export async function getGuestById(req: Request, res: Response, next: NextFunction) {
  try {
    const guest = await guestsService.getGuestById(req.params.id);
    sendSuccess(res, guest);
  } catch (err) { next(err); }
}

export async function createGuest(req: Request, res: Response, next: NextFunction) {
  try {
    const guest = await guestsService.createGuest(req.body);
    sendCreated(res, guest, 'Guest created');
  } catch (err) { next(err); }
}

export async function updateGuest(req: Request, res: Response, next: NextFunction) {
  try {
    const guest = await guestsService.updateGuest(req.params.id, req.body);
    sendSuccess(res, guest, 'Guest updated');
  } catch (err) { next(err); }
}

export async function getGuestReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const reservations = await guestsService.getGuestReservations(req.params.id);
    sendSuccess(res, reservations);
  } catch (err) { next(err); }
}
