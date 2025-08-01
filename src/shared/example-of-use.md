````js
// src/features/auth/auth.controller.ts
import { 
  UnauthorizedError, 
  UserAlreadyExistsError, 
  AppError,
  createErrorResponse 
} from '../../shared/errors/AppError'

async createAdmin(
  request: FastifyRequest<{ Body: CreateAdminBody }>,
  reply: FastifyReply
) {
  try {
    const { adminSecret, email, password, name, phone } = request.body
    const user = await authService.createAdmin(adminSecret, email, password, name, phone)

    return reply.status(201).send({
      message: 'Admin created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        plan: user.plan,
        role: user.role,
        language: user.language,
        timezone: user.timezone,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    request.log.error('Create admin error:', error)
    
    // Se for um erro customizado, usar diretamente
    if (error instanceof AppError) {
      const errorResponse = createErrorResponse(error, request.url)
      return reply.status(error.statusCode).send(errorResponse)
    }
    
    // Erro não tratado - log e retorna erro genérico
    request.log.error('Unhandled error:', error)
    const genericError = new InternalServerError('An unexpected error occurred')
    const errorResponse = createErrorResponse(genericError, request.url)
    return reply.status(500).send(errorResponse)
  }
}


// src/features/auth/auth.service.ts
import { 
  UnauthorizedError, 
  UserAlreadyExistsError, 
  InvalidCredentialsError,
  UserNotFoundError,
  ValidationError 
} from '../../shared/errors/AppError'

class AuthService {
  async createAdmin(adminSecret: string, email: string, password: string, name: string, phone: string) {
    // Verificar admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      throw new UnauthorizedError('Invalid admin secret')
    }

    // Verificar se usuário já existe
    const existingUser = await this.findUserByEmail(email)
    if (existingUser) {
      throw new UserAlreadyExistsError(`User with email ${email} already exists`)
    }

    // Validar formato do email
    if (!this.isValidEmail(email)) {
      throw new ValidationError('Invalid email format')
    }

    // Criar usuário...
    const user = await db.user.create({
      data: { email, password, name, phone, role: 'ADMIN' }
    })

    return user
  }

  async login(email: string, password: string) {
    const user = await this.findUserByEmail(email)
    if (!user) {
      throw new UserNotFoundError('User not found')
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new InvalidCredentialsError('Invalid email or password')
    }

    if (!user.status) {
      throw new AccountDisabledError('Account has been disabled')
    }

    return user
  }

  async getUserById(id: string) {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      throw new UserNotFoundError(`User with ID ${id} not found`)
    }
    return user
  }
}
````