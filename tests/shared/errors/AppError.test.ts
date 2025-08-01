import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  InvalidCredentialsError,
  TokenExpiredError,
  InvalidTokenError,
  UserNotFoundError,
  UserAlreadyExistsError,
  EmailAlreadyInUseError,
  AccountNotVerifiedError,
  AccountDisabledError,
  ValidationError,
  MissingRequiredFieldError,
  InvalidFormatError,
  NotFoundError,
  ConflictError,
  InsufficientPermissionsError,
  OperationNotAllowedError,
  ResourceLimitExceededError,
  PaymentRequiredError,
  SubscriptionExpiredError,
  PaymentFailedError,
  ExternalServiceError,
  ServiceUnavailableError,
  RateLimitExceededError,
  FileTooLargeError,
  UnsupportedFileTypeError,
  DatabaseError,
  DuplicateKeyError,
  BadRequestError,
  InternalServerError,
  createErrorResponse,
} from '../../../src/shared/errors/AppError.ts';

describe('AppError Classes', () => {
  it('should create an instance of UnauthorizedError with default message', () => {
    const error = new UnauthorizedError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Unauthorized access');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('should create an instance of UnauthorizedError with a custom message', () => {
    const error = new UnauthorizedError('Custom unauthorized message');
    expect(error.message).toBe('Custom unauthorized message');
  });

  it('should create an instance of ForbiddenError with default message', () => {
    const error = new ForbiddenError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Access forbidden');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('should create an instance of InvalidCredentialsError with default message', () => {
    const error = new InvalidCredentialsError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Invalid email or password');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should create an instance of TokenExpiredError with default message', () => {
    const error = new TokenExpiredError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Token has expired');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('TOKEN_EXPIRED');
  });

  it('should create an instance of InvalidTokenError with default message', () => {
    const error = new InvalidTokenError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Invalid or malformed token');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('INVALID_TOKEN');
  });

  it('should create an instance of UserNotFoundError with default message', () => {
    const error = new UserNotFoundError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('USER_NOT_FOUND');
  });

  it('should create an instance of UserAlreadyExistsError with default message', () => {
    const error = new UserAlreadyExistsError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('User already exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('USER_ALREADY_EXISTS');
  });

  it('should create an instance of EmailAlreadyInUseError with default message', () => {
    const error = new EmailAlreadyInUseError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Email is already in use');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('EMAIL_ALREADY_IN_USE');
  });

  it('should create an instance of AccountNotVerifiedError with default message', () => {
    const error = new AccountNotVerifiedError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Account email not verified');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('ACCOUNT_NOT_VERIFIED');
  });

  it('should create an instance of AccountDisabledError with default message', () => {
    const error = new AccountDisabledError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Account has been disabled');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('ACCOUNT_DISABLED');
  });

  it('should create an instance of ValidationError with default message', () => {
    const error = new ValidationError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should create an instance of MissingRequiredFieldError', () => {
    const error = new MissingRequiredFieldError('email');
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Missing required field: email');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('MISSING_REQUIRED_FIELD');
  });

  it('should create an instance of InvalidFormatError with expected format', () => {
    const error = new InvalidFormatError('date', 'YYYY-MM-DD');
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Invalid format for date. Expected: YYYY-MM-DD');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('INVALID_FORMAT');
  });

  it('should create an instance of InvalidFormatError without expected format', () => {
    const error = new InvalidFormatError('email');
    expect(error.message).toBe('Invalid format for email');
  });

  it('should create an instance of NotFoundError with default message', () => {
    const error = new NotFoundError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should create an instance of NotFoundError with a custom resource', () => {
    const error = new NotFoundError('User');
    expect(error.message).toBe('User not found');
  });

  it('should create an instance of ConflictError with default message', () => {
    const error = new ConflictError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Resource conflict');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });

  it('should create an instance of InsufficientPermissionsError with default message', () => {
    const error = new InsufficientPermissionsError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Insufficient permissions for this action');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  it('should create an instance of OperationNotAllowedError with default message', () => {
    const error = new OperationNotAllowedError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Operation not allowed');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('OPERATION_NOT_ALLOWED');
  });

  it('should create an instance of ResourceLimitExceededError', () => {
    const error = new ResourceLimitExceededError('API requests', 1000);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('API requests limit exceeded. Maximum allowed: 1000');
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RESOURCE_LIMIT_EXCEEDED');
  });

  it('should create an instance of PaymentRequiredError with default message', () => {
    const error = new PaymentRequiredError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Payment required to access this resource');
    expect(error.statusCode).toBe(402);
    expect(error.code).toBe('PAYMENT_REQUIRED');
  });

  it('should create an instance of SubscriptionExpiredError with default message', () => {
    const error = new SubscriptionExpiredError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Subscription has expired');
    expect(error.statusCode).toBe(402);
    expect(error.code).toBe('SUBSCRIPTION_EXPIRED');
  });

  it('should create an instance of PaymentFailedError with default message', () => {
    const error = new PaymentFailedError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Payment processing failed');
    expect(error.statusCode).toBe(402);
    expect(error.code).toBe('PAYMENT_FAILED');
  });

  it('should create an instance of ExternalServiceError', () => {
    const error = new ExternalServiceError('Google API', 'Request failed');
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Google API: Request failed');
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(error.service).toBe('Google API');
  });

  it('should create an instance of ServiceUnavailableError with a service name', () => {
    const error = new ServiceUnavailableError('Redis');
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Redis is temporarily unavailable');
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('should create an instance of ServiceUnavailableError without a service name', () => {
    const error = new ServiceUnavailableError();
    expect(error.message).toBe('Service temporarily unavailable');
  });

  it('should create an instance of RateLimitExceededError', () => {
    const error = new RateLimitExceededError(60);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Rate limit exceeded. Please try again later.');
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.retryAfter).toBe(60);
  });

  it('should create an instance of FileTooLargeError', () => {
    const error = new FileTooLargeError('10MB');
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('File size exceeds the maximum allowed size of 10MB');
    expect(error.statusCode).toBe(413);
    expect(error.code).toBe('FILE_TOO_LARGE');
  });

  it('should create an instance of UnsupportedFileTypeError', () => {
    const error = new UnsupportedFileTypeError(['.jpg', '.png']);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Unsupported file type. Allowed types: .jpg, .png');
    expect(error.statusCode).toBe(415);
    expect(error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('should create an instance of DatabaseError with default message', () => {
    const error = new DatabaseError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Database operation failed');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('DATABASE_ERROR');
  });

  it('should create an instance of DuplicateKeyError', () => {
    const error = new DuplicateKeyError('email');
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Duplicate value for field: email');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('DUPLICATE_KEY');
  });

  it('should create an instance of BadRequestError with default message', () => {
    const error = new BadRequestError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Bad request');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
  });

  it('should create an instance of InternalServerError with default message', () => {
    const error = new InternalServerError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Internal server error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  describe('createErrorResponse', () => {
    it('should create a valid error response', () => {
      const error = new UnauthorizedError();
      const response = createErrorResponse(error, '/test');

      expect(response.error.code).toBe('UNAUTHORIZED');
      expect(response.error.message).toBe('Unauthorized access');
      expect(response.error.statusCode).toBe(401);
      expect(response.error.path).toBe('/test');
      expect(response.error.timestamp).toBeDefined();
    });
  });
});
