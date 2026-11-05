import { Request, Response, NextFunction } from 'express';
import * as service from './room-types.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export async function getRoomTypes(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getRoomTypes(req.user!.hotelId)); } catch (e) { next(e); }
}
export async function getRoomTypeById(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getRoomTypeById(req.params.id)); } catch (e) { next(e); }
}
export async function createRoomType(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await service.createRoomType(req.user!.hotelId, req.body), 'Room type created'); } catch (e) { next(e); }
}
export async function updateRoomType(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.updateRoomType(req.params.id, req.body), 'Room type updated'); } catch (e) { next(e); }
}
export async function deleteRoomType(req: Request, res: Response, next: NextFunction) {
  try { await service.deleteRoomType(req.params.id); sendSuccess(res, null, 'Room type deleted'); } catch (e) { next(e); }
}
