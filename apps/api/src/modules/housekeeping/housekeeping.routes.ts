import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './housekeeping.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createTaskSchema, updateTaskStatusSchema } from './housekeeping.schema';

const router = Router();
router.use(authenticate);

router.get('/board', authorize(PERMISSIONS.HOUSEKEEPING_READ), ctrl.getHousekeepingBoard);
router.get('/tasks', authorize(PERMISSIONS.HOUSEKEEPING_READ), ctrl.getTasks);
router.post('/tasks', authorize(PERMISSIONS.HOUSEKEEPING_CREATE), validate(createTaskSchema), ctrl.createTask);
router.patch('/tasks/:id/status', authorize(PERMISSIONS.HOUSEKEEPING_UPDATE), validate(updateTaskStatusSchema), ctrl.updateTaskStatus);

export default router;
