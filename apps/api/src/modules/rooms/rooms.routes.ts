import { Router } from 'express';
import * as ctrl from './rooms.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createRoomSchema, updateRoomStatusSchema } from './rooms.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('rooms', 'read'), ctrl.getRooms);
router.get('/availability', authorize('rooms', 'read'), ctrl.getRoomAvailability);
router.get('/:id', authorize('rooms', 'read'), ctrl.getRoomById);
router.post('/', authorize('rooms', 'create'), validate(createRoomSchema), ctrl.createRoom);
router.put('/:id/status', authorize('rooms', 'update'), validate(updateRoomStatusSchema), ctrl.updateRoomStatus);

export default router;
