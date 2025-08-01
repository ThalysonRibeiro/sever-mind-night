
export abstract class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean = true

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = this.constructor.name

    // Mantém o stack trace correto
    Error.captureStackTrace(this, this.constructor)
  }
}

// ==================== AUTH ERRORS ====================
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid email or password') {
    super(message, 401, 'INVALID_CREDENTIALS')
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired') {
    super(message, 401, 'TOKEN_EXPIRED')
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid or malformed token') {
    super(message, 401, 'INVALID_TOKEN')
  }
}

// ==================== USER ERRORS ====================
export class UserNotFoundError extends AppError {
  constructor(message: string = 'User not found') {
    super(message, 404, 'USER_NOT_FOUND')
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(message: string = 'User already exists') {
    super(message, 409, 'USER_ALREADY_EXISTS')
  }
}

export class EmailAlreadyInUseError extends AppError {
  constructor(message: string = 'Email is already in use') {
    super(message, 409, 'EMAIL_ALREADY_IN_USE')
  }
}

export class AccountNotVerifiedError extends AppError {
  constructor(message: string = 'Account email not verified') {
    super(message, 403, 'ACCOUNT_NOT_VERIFIED')
  }
}

export class AccountDisabledError extends AppError {
  constructor(message: string = 'Account has been disabled') {
    super(message, 403, 'ACCOUNT_DISABLED')
  }
}

// ==================== VALIDATION ERRORS ====================
export class ValidationError extends AppError {
  public readonly details?: any

  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
  }
}

export class MissingRequiredFieldError extends AppError {
  constructor(field: string) {
    super(`Missing required field: ${field}`, 400, 'MISSING_REQUIRED_FIELD')
  }
}

export class InvalidFormatError extends AppError {
  constructor(field: string, expectedFormat?: string) {
    const message = expectedFormat
      ? `Invalid format for ${field}. Expected: ${expectedFormat}`
      : `Invalid format for ${field}`
    super(message, 400, 'INVALID_FORMAT')
  }
}

// ==================== RESOURCE ERRORS ====================
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
  }
}

// ==================== BUSINESS LOGIC ERRORS ====================
export class InsufficientPermissionsError extends AppError {
  constructor(message: string = 'Insufficient permissions for this action') {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS')
  }
}

export class OperationNotAllowedError extends AppError {
  constructor(message: string = 'Operation not allowed') {
    super(message, 403, 'OPERATION_NOT_ALLOWED')
  }
}

export class ResourceLimitExceededError extends AppError {
  constructor(resource: string, limit: number) {
    super(`${resource} limit exceeded. Maximum allowed: ${limit}`, 429, 'RESOURCE_LIMIT_EXCEEDED')
  }
}

// ==================== PAYMENT ERRORS ====================
export class PaymentRequiredError extends AppError {
  constructor(message: string = 'Payment required to access this resource') {
    super(message, 402, 'PAYMENT_REQUIRED')
  }
}

export class SubscriptionExpiredError extends AppError {
  constructor(message: string = 'Subscription has expired') {
    super(message, 402, 'SUBSCRIPTION_EXPIRED')
  }
}

export class PaymentFailedError extends AppError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 402, 'PAYMENT_FAILED')
  }
}

// ==================== EXTERNAL SERVICE ERRORS ====================
export class ExternalServiceError extends AppError {
  public readonly service: string

  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR')
    this.service = service
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service?: string) {
    const message = service ? `${service} is temporarily unavailable` : 'Service temporarily unavailable'
    super(message, 503, 'SERVICE_UNAVAILABLE')
  }
}

// ==================== RATE LIMITING ERRORS ====================
export class RateLimitExceededError extends AppError {
  public readonly retryAfter?: number

  constructor(retryAfter?: number) {
    super('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED')
    this.retryAfter = retryAfter
  }
}

// ==================== FILE ERRORS ====================
export class FileTooLargeError extends AppError {
  constructor(maxSize: string) {
    super(`File size exceeds the maximum allowed size of ${maxSize}`, 413, 'FILE_TOO_LARGE')
  }
}

export class UnsupportedFileTypeError extends AppError {
  constructor(allowedTypes: string[]) {
    super(`Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`, 415, 'UNSUPPORTED_FILE_TYPE')
  }
}

// ==================== DATABASE ERRORS ====================
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR')
  }
}

export class DuplicateKeyError extends AppError {
  constructor(field: string) {
    super(`Duplicate value for field: ${field}`, 409, 'DUPLICATE_KEY')
  }
}

// ==================== GENERIC ERRORS ====================
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST')
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR')
  }
}

// ==================== ERROR HANDLER MIDDLEWARE ====================
export interface ErrorResponse {
  error: {
    code: string
    message: string
    statusCode: number
    details?: any
    timestamp: string
    path?: string
  }
}

export function createErrorResponse(error: AppError, path?: string): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: (error as any).details,
      timestamp: new Date().toISOString(),
      path,
    }
  }
}