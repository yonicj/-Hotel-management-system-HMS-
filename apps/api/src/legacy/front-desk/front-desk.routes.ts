import { Router } from 'express';
import * as ctrl from './front-desk.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.post('/check-in/:reservationId', authorize('front_desk', 'update'), ctrl.checkIn);
router.post('/check-out/:reservationId', authorize('front_desk', 'update'), ctrl.checkOut);
router.get('/arrivals', authorize('front_desk', 'read'), ctrl.getArrivals);
router.get('/departures', authorize('front_desk', 'read'), ctrl.getDepartures);
router.get('/in-house', authorize('front_desk', 'read'), ctrl.getInHouse);
router.get('/room-rack', authorize('front_desk', 'read'), ctrl.getRoomRack);

export default router;
