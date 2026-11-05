import { Request, Response, NextFunction } from 'express';
import * as service from './housekeeping.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getTasks(req.user!.hotelId, req.query.date as string)); } catch (e) { next(e); }
}
export async function createTask(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await service.createTask(req.body), 'Task created'); } catch (e) { next(e); }
}
export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.updateTaskStatus(req.params.id, req.body), 'Task updated'); } catch (e) { next(e); }
}
export async function getHousekeepingBoard(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getHousekeepingBoard(req.user!.hotelId)); } catch (e) { next(e); }
}
