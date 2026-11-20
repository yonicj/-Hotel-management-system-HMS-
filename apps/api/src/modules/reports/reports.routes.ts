import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './reports.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/occupancy', authorize(PERMISSIONS.REPORTS_READ), ctrl.getOccupancyReport);
router.get('/revenue', authorize(PERMISSIONS.REPORTS_READ), ctrl.getRevenueReport);
router.get('/arrivals-departures', authorize(PERMISSIONS.REPORTS_READ), ctrl.getArrivalsDeparturesReport);
router.get('/housekeeping-summary', authorize(PERMISSIONS.REPORTS_READ), ctrl.getHousekeepingSummary);
router.get('/guest-ledger', authorize(PERMISSIONS.REPORTS_READ), ctrl.getGuestLedger);

export default router;
