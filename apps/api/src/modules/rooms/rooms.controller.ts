import { Request, Response, NextFunction } from 'express';
import * as roomsService from './rooms.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export async function getRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const rooms = await roomsService.getRooms(req.user!.hotelId);
    sendSuccess(res, rooms);
  } catch (err) { next(err); }
}

export async function getRoomAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { check_in, check_out, room_type_id } = req.query as Record<string, string>;
    const rooms = await roomsService.getRoomAvailability(req.user!.hotelId, check_in, check_out, room_type_id);
    sendSuccess(res, rooms);
  } catch (err) { next(err); }
}

export async function getRoomById(req: Request, res: Response, next: NextFunction) {
  try {
    const room = await roomsService.getRoomById(req.params.id);
    sendSuccess(res, room);
  } catch (err) { next(err); }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const room = await roomsService.createRoom(req.user!.hotelId, req.body);
    sendCreated(res, room, 'Room created');
  } catch (err) { next(err); }
}

export async function updateRoomStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const room = await roomsService.updateRoomStatus(req.params.id, req.body, req.user!.userId, req.user!.hotelId);
    sendSuccess(res, room, 'Room status updated');
  } catch (err) { next(err); }
}
