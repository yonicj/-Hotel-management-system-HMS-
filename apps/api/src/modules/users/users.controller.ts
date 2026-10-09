import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { users, pagination } = await usersService.getUsers(req.user!.hotelId, req.query.page, req.query.limit);
    sendPaginated(res, users, pagination);
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.params.id);
    sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body);
    sendCreated(res, user, 'User created');
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    sendSuccess(res, user, 'User updated');
  } catch (err) { next(err); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deleteUser(req.params.id);
    sendSuccess(res, null, 'User deactivated');
  } catch (err) { next(err); }
}
