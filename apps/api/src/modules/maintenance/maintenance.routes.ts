import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './maintenance.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.MAINTENANCE_READ), ctrl.getMaintenanceReports);
router.get('/:id', authorize(PERMISSIONS.MAINTENANCE_READ), ctrl.getMaintenanceReportById);
router.post('/', authorize(PERMISSIONS.MAINTENANCE_CREATE), ctrl.createMaintenanceReport);
router.patch('/:id/status', authorize(PERMISSIONS.MAINTENANCE_UPDATE), ctrl.updateMaintenanceStatus);

export default router;
