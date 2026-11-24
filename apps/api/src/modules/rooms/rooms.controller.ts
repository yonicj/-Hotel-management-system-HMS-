import { Request, Response, NextFunction } from 'express';
import * as roomsService from './rooms.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';

export async function getRooms(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await roomsService.getRooms(req.user!.hotelId)); } catch (err) { next(err); }
}

export async function getRoomAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as Record<string, string | undefined>;
    const checkIn = q.checkInDate || q.check_in;
    const checkOut = q.checkOutDate || q.check_out;
    const roomTypeId = q.roomTypeId || q.room_type_id;

    if (!checkIn || !checkOut) {
      throw new AppError(
        'checkInDate and checkOutDate query parameters are required',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    sendSuccess(
      res,
      await roomsService.getRoomAvailability(req.user!.hotelId, checkIn, checkOut, roomTypeId)
    );
  } catch (err) { next(err); }
}

export async function getRoomById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await roomsService.getRoomById(req.params.id)); } catch (err) { next(err); }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    sendCreated(
      res,
      await roomsService.createRoom(req.user!.hotelId, req.body, req.user!.userId),
      'Room created'
    );
  } catch (err) { next(err); }
}

export async function updateRoomStatus(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res,
      await roomsService.updateRoomStatus(req.params.id, req.body, req.user!.userId, req.user!.hotelId),
      'Room status updated'
    );
  } catch (err) { next(err); }
}
