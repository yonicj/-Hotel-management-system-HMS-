import { Router } from 'express';
import * as ctrl from './rate-plans.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createRatePlanSchema, updateRatePlanSchema } from './rate-plans.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('rate_plans', 'read'), ctrl.getRatePlans);
router.get('/compute', authorize('rate_plans', 'read'), ctrl.computeRate);
router.post('/', authorize('rate_plans', 'create'), validate(createRatePlanSchema), ctrl.createRatePlan);
router.put('/:id', authorize('rate_plans', 'update'), validate(updateRatePlanSchema), ctrl.updateRatePlan);

export default router;
