import { Request, Response, NextFunction } from 'express';
import * as roomsService from './rooms.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export async function getRooms(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await roomsService.getRooms(req.user!.hotelId)); } catch (err) { next(err); }
}

export async function getRoomAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { check_in, check_out, room_type_id } = req.query as Record<string, string>;
    sendSuccess(res, await roomsService.getRoomAvailability(req.user!.hotelId, check_in, check_out, room_type_id));
  } catch (err) { next(err); }
}

export async function getRoomById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await roomsService.getRoomById(req.params.id)); } catch (err) { next(err); }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await roomsService.createRoom(req.user!.hotelId, req.body), 'Room created'); } catch (err) { next(err); }
}

export async function updateRoomStatus(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res,
      await roomsService.updateRoomStatus(req.params.id, req.body, req.user!.userId, req.user!.hotelId),
      'Room status updated'
    );
  } catch (err) { next(err); }
}
