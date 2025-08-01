import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  AppError,
  createErrorResponse,
  InternalServerError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitExceededError
} from '../errors/AppError.ts'

export async function errorHandler(
  error: any, // FastifyError não está disponível como named export
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log do erro
  request.log.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
    },
    req: {
      method: request.method,
      url: request.url,
      headers: request.headers,
    }
  }, 'Request error')

  // Se for um erro customizado
  if (error instanceof AppError) {
    const errorResponse = createErrorResponse(error, request.url)
    return reply.status(error.statusCode).send(errorResponse)
  }

  // Erros específicos do Fastify
  if (error.statusCode) {
    // Criar um erro concreto baseado no status code
    let concreteError: AppError

    switch (error.statusCode) {
      case 400:
        concreteError = new BadRequestError(error.message)
        break
      case 401:
        concreteError = new UnauthorizedError(error.message)
        break
      case 403:
        concreteError = new ForbiddenError(error.message)
        break
      case 404:
        concreteError = new NotFoundError(error.message)
        break
      case 409:
        concreteError = new ConflictError(error.message)
        break
      case 429:
        concreteError = new RateLimitExceededError()
        break
      default:
        concreteError = new InternalServerError(error.message)
    }

    const errorResponse = createErrorResponse(concreteError, request.url)
    return reply.status(error.statusCode).send(errorResponse)
  }

  // Erro não tratado
  const genericError = new InternalServerError('An unexpected error occurred')
  const errorResponse = createErrorResponse(genericError, request.url)
  return reply.status(500).send(errorResponse)
}

// Para registrar no Fastify:
// app.setErrorHandler(errorHandler)