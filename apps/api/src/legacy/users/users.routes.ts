import { Router } from 'express';
import * as ctrl from './users.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createUserSchema, updateUserSchema } from './users.schema';

const router = Router();

router.use(authenticate);

router.get('/', authorize('users', 'read'), ctrl.getUsers);
router.get('/:id', authorize('users', 'read'), ctrl.getUserById);
router.post('/', authorize('users', 'create'), validate(createUserSchema), ctrl.createUser);
router.put('/:id', authorize('users', 'update'), validate(updateUserSchema), ctrl.updateUser);
router.delete('/:id', authorize('users', 'delete'), ctrl.deleteUser);

export default router;
