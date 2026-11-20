import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './room-types.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createRoomTypeSchema, updateRoomTypeSchema } from './room-types.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.ROOM_TYPES_READ), ctrl.getRoomTypes);
router.get('/:id', authorize(PERMISSIONS.ROOM_TYPES_READ), ctrl.getRoomTypeById);
router.post('/', authorize(PERMISSIONS.ROOM_TYPES_CREATE), validate(createRoomTypeSchema), ctrl.createRoomType);
router.put('/:id', authorize(PERMISSIONS.ROOM_TYPES_UPDATE), validate(updateRoomTypeSchema), ctrl.updateRoomType);
router.delete('/:id', authorize(PERMISSIONS.ROOM_TYPES_DELETE), ctrl.deleteRoomType);

export default router;
