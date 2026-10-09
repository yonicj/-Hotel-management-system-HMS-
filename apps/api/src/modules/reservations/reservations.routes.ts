import { Router } from 'express';
import * as ctrl from './reservations.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createReservationSchema, updateReservationSchema, assignRoomSchema } from './reservations.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('reservations', 'read'), ctrl.getReservations);
router.get('/:id', authorize('reservations', 'read'), ctrl.getReservationById);
router.post('/', authorize('reservations', 'create'), validate(createReservationSchema), ctrl.createReservation);
router.patch('/:id/confirm', authorize('reservations', 'update'), ctrl.confirmReservation);
router.patch('/:id/assign-room', authorize('reservations', 'update'), validate(assignRoomSchema), ctrl.assignRoom);
router.delete('/:id', authorize('reservations', 'update'), ctrl.cancelReservation);

export default router;
