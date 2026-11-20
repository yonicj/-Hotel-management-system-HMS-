import { Request, Response, NextFunction } from 'express';
import * as service from './floors.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export async function getFloors(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getFloors(req.query.hotelId as string));
  } catch (err) {
    next(err);
  }
}

export async function getFloorById(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getFloorById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createFloor(req: Request, res: Response, next: NextFunction) {
  try {
    sendCreated(res, await service.createFloor(req.body), 'Floor created');
  } catch (err) {
    next(err);
  }
}

export async function updateFloor(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.updateFloor(req.params.id, req.body), 'Floor updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteFloor(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteFloor(req.params.id);
    sendSuccess(res, null, 'Floor deleted');
  } catch (err) {
    next(err);
  }
}
