import { Router } from 'express';
import * as ctrl from './room-types.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createRoomTypeSchema, updateRoomTypeSchema } from './room-types.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize('room_types', 'read'), ctrl.getRoomTypes);
router.get('/:id', authorize('room_types', 'read'), ctrl.getRoomTypeById);
router.post('/', authorize('room_types', 'create'), validate(createRoomTypeSchema), ctrl.createRoomType);
router.put('/:id', authorize('room_types', 'update'), validate(updateRoomTypeSchema), ctrl.updateRoomType);
router.delete('/:id', authorize('room_types', 'delete'), ctrl.deleteRoomType);

export default router;
