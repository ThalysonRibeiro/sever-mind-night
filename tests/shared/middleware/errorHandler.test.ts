import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { errorHandler } from '../../../src/shared/middleware/errorHandler.ts';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitExceededError,
  InternalServerError,
  createErrorResponse
} from '../../../src/shared/errors/AppError.ts';

describe('errorHandler middleware', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    // Mock para o request
    mockRequest = {
      log: {
        error: jest.fn(),
      },
      method: 'GET',
      url: '/test',
      headers: { 'user-agent': 'test-agent' },
    };

    // Mock para o reply
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  it('should handle AppError instances correctly', async () => {
    const error = new BadRequestError('Invalid input');
    
    await errorHandler(error, mockRequest, mockReply);
    
    expect(mockRequest.log.error).toHaveBeenCalled();
    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          statusCode: 400,
          path: '/test'
        })
      })
    );
  });

  it('should handle Fastify errors with status code 400', async () => {
    const error = { statusCode: 400, message: 'Bad request' };
    
    await errorHandler(error, mockRequest, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'BAD_REQUEST',
          statusCode: 400,
          path: '/test'
        })
      })
    );
  });

  it('should handle Fastify errors with status code 401', async () => {
    const error = { statusCode: 401, message: 'Unauthorized' };
    
    await errorHandler(error, mockRequest, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'UNAUTHORIZED',
          statusCode: 401,
          path: '/test'
        })
      })
    );
  });

  it('should handle Fastify errors with status code 403', async () => {
    const error = { statusCode: 403, message: 'Forbidden' };
    
    await errorHandler(error, mockRequest, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'FORBIDDEN',
          statusCode: 403,
          path: '/test'
        })
      })
    );
  });

  it('should handle Fastify errors with status code 404', async () => {
    const error = { statusCode: 404, message: 'Not found' };
    
    await errorHandler(error, mockRequest, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(404);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          statusCode: 404,
          path: '/test'
        })
      })
    );
  });

  it('should handle Fastify errors with status code 409', async () => {
    const error = { statusCode: 409, message: 'Conflict' };
    
    await errorHandler(error, mockRequest, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(409);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'CONFLICT',
          statusCode: 409,
          path: '/test'
        })
      })
    );
  });

  it('should handle Fastify errors with status code 429', async () => {
    const error = { statusCode: 429, message: 'Too many requests' };
    
    await errorHandler(error, mockRequest, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(429);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          path: '/test'
        })
      })
    );
  });

  it('should handle Fastify errors with other status codes', async () => {
    const error = { statusCode: 418, message: 'I\'m a teapot' };
    
    await errorHandler(error, mockRequest, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(418);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500,
          path: '/test'
        })
      })
    );
  });

  it('should handle unknown errors', async () => {
    const error = new Error('Unknown error');
    
    await errorHandler(error, mockRequest, mockReply);
    
    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          statusCode: 500,
          path: '/test'
        })
      })
    );
  });
});