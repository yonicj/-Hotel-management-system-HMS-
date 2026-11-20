import { Request, Response, NextFunction } from 'express';
import * as service from './roles.service';
import { sendSuccess } from '../../shared/utils/response';

export async function getRoles(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getRoles());
  } catch (err) {
    next(err);
  }
}

export async function getRoleById(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getRoleById(req.params.id));
  } catch (err) {
    next(err);
  }
}
