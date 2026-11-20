import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './guests.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createGuestSchema, updateGuestSchema } from './guests.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.GUESTS_READ), ctrl.getGuests);
router.get('/:id', authorize(PERMISSIONS.GUESTS_READ), ctrl.getGuestById);
router.get('/:id/reservations', authorize(PERMISSIONS.GUESTS_READ), ctrl.getGuestReservations);
router.post('/', authorize(PERMISSIONS.GUESTS_CREATE), validate(createGuestSchema), ctrl.createGuest);
router.put('/:id', authorize(PERMISSIONS.GUESTS_UPDATE), validate(updateGuestSchema), ctrl.updateGuest);

export default router;
