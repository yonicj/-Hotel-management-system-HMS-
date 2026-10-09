import { Router } from 'express';
import * as ctrl from './night-audit.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/status', authorize('night_audit', 'read'), ctrl.getNightAuditStatus);
router.get('/history', authorize('night_audit', 'read'), ctrl.getNightAuditHistory);
router.post('/run', authorize('night_audit', 'create'), ctrl.runNightAudit);

export default router;
