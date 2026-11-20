import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './audit-log.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.AUDIT_LOG_READ), ctrl.getAuditLogs);
router.get('/:id', authorize(PERMISSIONS.AUDIT_LOG_READ), ctrl.getAuditLogById);

export default router;
