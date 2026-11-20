import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './billing.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { addChargeSchema, addPaymentSchema } from './billing.schema';

const router = Router();
router.use(authenticate);

router.get('/:id', authorize(PERMISSIONS.BILLING_READ), ctrl.getFolio);
router.get('/:id/invoice', authorize(PERMISSIONS.BILLING_READ), ctrl.getInvoice);
router.post('/:id/charges', authorize(PERMISSIONS.BILLING_CREATE), validate(addChargeSchema), ctrl.addCharge);
router.delete('/:id/charges/:chargeId', authorize(PERMISSIONS.BILLING_DELETE), ctrl.deleteCharge);
router.post('/:id/payments', authorize(PERMISSIONS.BILLING_CREATE), validate(addPaymentSchema), ctrl.addPayment);
router.post('/:id/close', authorize(PERMISSIONS.BILLING_UPDATE), ctrl.closeFolio);

export default router;
