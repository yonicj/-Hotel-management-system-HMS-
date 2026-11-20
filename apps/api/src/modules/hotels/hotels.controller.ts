import { Request, Response, NextFunction } from 'express';
import * as service from './hotels.service';
import { sendSuccess } from '../../shared/utils/response';

export async function getHotels(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getHotels());
  } catch (err) {
    next(err);
  }
}

export async function getHotelById(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getHotelById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function updateHotel(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.updateHotel(req.params.id, req.body), 'Hotel updated');
  } catch (err) {
    next(err);
  }
}
