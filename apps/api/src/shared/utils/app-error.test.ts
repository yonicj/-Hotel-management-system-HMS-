import { describe, it, expect } from 'vitest';
import { AppError } from './app-error';

describe('AppError', () => {
  it('should initialize with default 500 status code', () => {
    const error = new AppError('Internal Error');
    expect(error.message).toBe('Internal Error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('should set custom status code', () => {
    const error = new AppError('Not Found', 404);
    expect(error.message).toBe('Not Found');
    expect(error.statusCode).toBe(404);
  });
});

