import { Request, Response, NextFunction } from 'express';
import * as service from './billing.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export async function getFolio(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getFolio(req.params.id)); } catch (e) { next(e); }
}
export async function addCharge(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await service.addCharge(req.params.id, req.body, req.user!.userId), 'Charge added'); } catch (e) { next(e); }
}
export async function deleteCharge(req: Request, res: Response, next: NextFunction) {
  try { await service.deleteCharge(req.params.id, req.params.chargeId); sendSuccess(res, null, 'Charge removed'); } catch (e) { next(e); }
}
export async function addPayment(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await service.addPayment(req.params.id, req.body, req.user!.userId), 'Payment recorded'); } catch (e) { next(e); }
}
export async function closeFolio(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.closeFolio(req.params.id), 'Folio closed'); } catch (e) { next(e); }
}
export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await service.getInvoice(req.params.id)); } catch (e) { next(e); }
}
