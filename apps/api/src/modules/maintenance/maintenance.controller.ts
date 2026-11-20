import { Request, Response, NextFunction } from 'express';
import * as service from './maintenance.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export async function getMaintenanceReports(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getMaintenanceReports(req.query.roomId as string));
  } catch (err) {
    next(err);
  }
}

export async function getMaintenanceReportById(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getMaintenanceReportById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createMaintenanceReport(req: Request, res: Response, next: NextFunction) {
  try {
    sendCreated(
      res,
      await service.createMaintenanceReport(req.body, req.user!.userId),
      'Maintenance report created'
    );
  } catch (err) {
    next(err);
  }
}

export async function updateMaintenanceStatus(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(
      res,
      await service.updateMaintenanceStatus(req.params.id, req.body.status, req.user!.userId),
      'Maintenance status updated'
    );
  } catch (err) {
    next(err);
  }
}
