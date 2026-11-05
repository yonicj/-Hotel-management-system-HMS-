import { Router } from 'express';
import * as ctrl from './guests.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createGuestSchema, updateGuestSchema } from './guests.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('guests', 'read'), ctrl.getGuests);
router.get('/:id', authorize('guests', 'read'), ctrl.getGuestById);
router.get('/:id/reservations', authorize('guests', 'read'), ctrl.getGuestReservations);
router.post('/', authorize('guests', 'create'), validate(createGuestSchema), ctrl.createGuest);
router.put('/:id', authorize('guests', 'update'), validate(updateGuestSchema), ctrl.updateGuest);

export default router;
