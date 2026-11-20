import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './floors.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.FLOORS_READ), ctrl.getFloors);
router.get('/:id', authorize(PERMISSIONS.FLOORS_READ), ctrl.getFloorById);
router.post('/', authorize(PERMISSIONS.FLOORS_CREATE), ctrl.createFloor);
router.put('/:id', authorize(PERMISSIONS.FLOORS_UPDATE), ctrl.updateFloor);
router.delete('/:id', authorize(PERMISSIONS.FLOORS_DELETE), ctrl.deleteFloor);

export default router;
