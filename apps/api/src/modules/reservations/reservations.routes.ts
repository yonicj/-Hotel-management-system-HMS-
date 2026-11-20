import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './reservations.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createReservationSchema, assignRoomSchema } from './reservations.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.RESERVATIONS_READ), ctrl.getReservations);
router.get('/:id', authorize(PERMISSIONS.RESERVATIONS_READ), ctrl.getReservationById);
router.post('/', authorize(PERMISSIONS.RESERVATIONS_CREATE), validate(createReservationSchema), ctrl.createReservation);
router.patch('/:id/confirm', authorize(PERMISSIONS.RESERVATIONS_UPDATE), ctrl.confirmReservation);
router.patch('/:id/assign-room', authorize(PERMISSIONS.RESERVATIONS_UPDATE), validate(assignRoomSchema), ctrl.assignRoom);
router.delete('/:id', authorize(PERMISSIONS.RESERVATIONS_UPDATE), ctrl.cancelReservation);

export default router;
