import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './front-desk.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.post('/check-in/:reservationId', authorize(PERMISSIONS.FRONT_DESK_UPDATE), ctrl.checkIn);
router.post('/check-out/:reservationId', authorize(PERMISSIONS.FRONT_DESK_UPDATE), ctrl.checkOut);
router.get('/arrivals', authorize(PERMISSIONS.FRONT_DESK_READ), ctrl.getArrivals);
router.get('/departures', authorize(PERMISSIONS.FRONT_DESK_READ), ctrl.getDepartures);
router.get('/in-house', authorize(PERMISSIONS.FRONT_DESK_READ), ctrl.getInHouse);
router.get('/room-rack', authorize(PERMISSIONS.FRONT_DESK_READ), ctrl.getRoomRack);

export default router;
