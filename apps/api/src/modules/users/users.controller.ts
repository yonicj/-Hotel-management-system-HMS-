import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { users, pagination } = await usersService.getUsers(
      req.user!.hotelId, req.query.page, req.query.limit
    );
    sendPaginated(res, users, pagination);
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await usersService.getUserById(req.params.id));
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    sendCreated(res, await usersService.createUser(req.body), 'User created');
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await usersService.updateUser(req.params.id, req.body), 'User updated');
  } catch (err) { next(err); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deactivateUser(req.params.id);
    sendSuccess(res, null, 'User deactivated');
  } catch (err) { next(err); }
}
