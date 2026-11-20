import { Router } from 'express';
import { PERMISSIONS } from '@ehms/config';
import * as ctrl from './users.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createUserSchema, updateUserSchema } from './users.schema';

const router = Router();
router.use(authenticate);

router.get('/', authorize(PERMISSIONS.USERS_READ), ctrl.getUsers);
router.get('/:id', authorize(PERMISSIONS.USERS_READ), ctrl.getUserById);
router.post('/', authorize(PERMISSIONS.USERS_CREATE), validate(createUserSchema), ctrl.createUser);
router.put('/:id', authorize(PERMISSIONS.USERS_UPDATE), validate(updateUserSchema), ctrl.updateUser);
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), ctrl.deleteUser);

export default router;
