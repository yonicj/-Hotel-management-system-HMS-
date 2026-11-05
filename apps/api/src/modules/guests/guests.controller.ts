import { Request, Response, NextFunction } from 'express';
import * as guestsService from './guests.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export async function getGuests(req: Request, res: Response, next: NextFunction) {
  try {
    const { guests, pagination } = await guestsService.getGuests(
      req.query.search as string, req.query.page, req.query.limit
    );
    sendPaginated(res, guests, pagination);
  } catch (err) { next(err); }
}

export async function getGuestById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await guestsService.getGuestById(req.params.id)); } catch (err) { next(err); }
}

export async function createGuest(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await guestsService.createGuest(req.body), 'Guest created'); } catch (err) { next(err); }
}

export async function updateGuest(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await guestsService.updateGuest(req.params.id, req.body), 'Guest updated'); } catch (err) { next(err); }
}

export async function getGuestReservations(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await guestsService.getGuestReservations(req.params.id)); } catch (err) { next(err); }
}
