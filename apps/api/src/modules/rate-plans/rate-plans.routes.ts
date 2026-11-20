import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './rate-plans.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createRatePlanSchema, updateRatePlanSchema } from './rate-plans.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.RATE_PLANS_READ), ctrl.getRatePlans);
router.get('/compute', authorize(PERMISSIONS.RATE_PLANS_READ), ctrl.computeRate);
router.post('/', authorize(PERMISSIONS.RATE_PLANS_CREATE), validate(createRatePlanSchema), ctrl.createRatePlan);
router.put('/:id', authorize(PERMISSIONS.RATE_PLANS_UPDATE), validate(updateRatePlanSchema), ctrl.updateRatePlan);

export default router;
