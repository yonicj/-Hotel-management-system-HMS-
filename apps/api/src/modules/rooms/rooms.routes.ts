import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './rooms.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createRoomSchema, updateRoomStatusSchema } from './rooms.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.ROOMS_READ), ctrl.getRooms);
router.get('/availability', authorize(PERMISSIONS.ROOMS_READ), ctrl.getRoomAvailability);
router.get('/:id', authorize(PERMISSIONS.ROOMS_READ), ctrl.getRoomById);
router.post('/', authorize(PERMISSIONS.ROOMS_CREATE), validate(createRoomSchema), ctrl.createRoom);
router.put('/:id/status', authorize(PERMISSIONS.ROOMS_UPDATE), validate(updateRoomStatusSchema), ctrl.updateRoomStatus);

export default router;
