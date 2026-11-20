import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './roles.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.ROLES_READ), ctrl.getRoles);
router.get('/:id', authorize(PERMISSIONS.ROLES_READ), ctrl.getRoleById);

export default router;
