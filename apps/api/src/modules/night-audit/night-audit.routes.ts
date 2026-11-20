import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './night-audit.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/status', authorize(PERMISSIONS.NIGHT_AUDIT_READ), ctrl.getNightAuditStatus);
router.get('/history', authorize(PERMISSIONS.NIGHT_AUDIT_READ), ctrl.getNightAuditHistory);
router.post('/run', authorize(PERMISSIONS.NIGHT_AUDIT_CREATE), ctrl.runNightAudit);

export default router;
