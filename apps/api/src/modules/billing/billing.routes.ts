import { Router } from 'express';
import * as ctrl from './billing.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { addChargeSchema, addPaymentSchema } from './billing.schema';

const router = Router();
router.use(authenticate);

router.get('/:id', authorize('billing', 'read'), ctrl.getFolio);
router.get('/:id/invoice', authorize('billing', 'read'), ctrl.getInvoice);
router.post('/:id/charges', authorize('billing', 'create'), validate(addChargeSchema), ctrl.addCharge);
router.delete('/:id/charges/:chargeId', authorize('billing', 'delete'), ctrl.deleteCharge);
router.post('/:id/payments', authorize('billing', 'create'), validate(addPaymentSchema), ctrl.addPayment);
router.post('/:id/close', authorize('billing', 'update'), ctrl.closeFolio);

export default router;
