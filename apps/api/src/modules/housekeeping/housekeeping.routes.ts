import { Router } from 'express';
import * as ctrl from './housekeeping.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createTaskSchema, updateTaskStatusSchema } from './housekeeping.schema';

const router = Router();
router.use(authenticate);

router.get('/board', authorize('housekeeping', 'read'), ctrl.getHousekeepingBoard);
router.get('/tasks', authorize('housekeeping', 'read'), ctrl.getTasks);
router.post('/tasks', authorize('housekeeping', 'create'), validate(createTaskSchema), ctrl.createTask);
router.patch('/tasks/:id/status', authorize('housekeeping', 'update'), validate(updateTaskStatusSchema), ctrl.updateTaskStatus);

export default router;
