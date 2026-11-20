import { describe, it, expect } from 'vitest';
import { AppError } from './app-error';
import { ErrorCode } from '@ehms/types';

describe('AppError', () => {
  it('should initialize with default 500 status code and INTERNAL_ERROR code', () => {
    const error = new AppError('Internal Error');
    expect(error.message).toBe('Internal Error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.details).toBeNull();
    expect(error.isOperational).toBe(true);
  });

  it('should set custom status code and default mapped code', () => {
    const error = new AppError('Not Found', 404);
    expect(error.message).toBe('Not Found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it('should accept custom domain code and details', () => {
    const error = new AppError(
      'Room is occupied',
      409,
      ErrorCode.ROOM_UNAVAILABLE,
      { roomId: 'room-101' }
    );
    expect(error.message).toBe('Room is occupied');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe(ErrorCode.ROOM_UNAVAILABLE);
    expect(error.details).toEqual({ roomId: 'room-101' });
  });
});
