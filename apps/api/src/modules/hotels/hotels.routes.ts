import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './hotels.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.HOTELS_READ), ctrl.getHotels);
router.get('/:id', authorize(PERMISSIONS.HOTELS_READ), ctrl.getHotelById);
router.put('/:id', authorize(PERMISSIONS.HOTELS_UPDATE), ctrl.updateHotel);

export default router;
