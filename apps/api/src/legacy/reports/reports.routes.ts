import { Router } from 'express';
import * as ctrl from './reports.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/occupancy', authorize('reports', 'read'), ctrl.getOccupancyReport);
router.get('/revenue', authorize('reports', 'read'), ctrl.getRevenueReport);
router.get('/arrivals-departures', authorize('reports', 'read'), ctrl.getArrivalsDeparturesReport);
router.get('/housekeeping-summary', authorize('reports', 'read'), ctrl.getHousekeepingSummary);
router.get('/guest-ledger', authorize('reports', 'read'), ctrl.getGuestLedger);

export default router;
