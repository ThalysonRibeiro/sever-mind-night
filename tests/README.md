# Testes da Aplicação

Este diretório contém todos os testes da aplicação, organizados por funcionalidade.

## Estrutura dos Testes

```
tests/
├── routes/                    # Testes das rotas da aplicação
│   ├── index.test.ts              # Testes das rotas principais
│   ├── auth.test.ts               # Testes das rotas de autenticação
│   └── auth-admin.test.ts         # Testes das rotas de admin
├── shared/                    # Testes dos componentes compartilhados
│   ├── errors/                    # Testes de tratamento de erros
│   └── middleware/                # Testes dos middlewares
│       └── errorHandler.test.ts   # Testes do middleware de erro
├── utils/                     # Testes dos utilitários
│   ├── helpers.ts                 # Funções auxiliares para testes
│   └── rateLimiter.test.ts        # Testes do rate limiter
├── lib/                       # Testes das bibliotecas
│   └── google-auth.test.ts        # Testes da autenticação Google
├── features/                  # Testes das features
│   └── auth/                      # Testes de autenticação
├── e2e/                       # Testes end-to-end
│   └── auth.e2e.test.ts           # Testes E2E de autenticação
├── plugins.test.ts            # Testes dos plugins
├── utils.test.ts              # Testes dos utilitários gerais
├── setup.ts                   # Configuração global dos testes
└── setup.e2e.ts               # Setup específico para testes E2E
```

## Como Executar os Testes

### Todos os Testes
```bash
npm test
```

### Testes Específicos
```bash
# Apenas testes de rotas
npm run test:routes

# Apenas testes de autenticação
npm run test:auth

# Apenas testes de plugins
npm run test:plugins

# Apenas testes de utilitários
npm run test:utils

# Testes end-to-end
npm run test:e2e

# Testes específicos por arquivo
npx jest tests/shared/middleware/errorHandler.test.ts
npx jest tests/utils/rateLimiter.test.ts
npx jest tests/lib/google-auth.test.ts
```

### Modos de Execução
```bash
# Modo watch (desenvolvimento)
npm run test:watch

# Com cobertura de código
npm run test:coverage

# Para CI/CD
npm run test:ci

# Testes rápidos (para debug)
npm run test:quick
```

## Tipos de Testes

### 1. Testes de Rotas (`routes/`)
- **index.test.ts**: Testa as rotas principais da aplicação
  - Health check (`GET /`)
  - Health com timestamp (`GET /health`)
  - Rotas protegidas (`GET /editor-stuff`)

- **auth.test.ts**: Testa as rotas de autenticação
  - Logout (`POST /auth/logout`)
  - Informações do usuário (`GET /auth/me`)
  - Google OAuth (`GET /auth/google`, `GET /auth/google/callback`)
  - NextJS Auth (`POST /auth/nextjs/signin`)

- **auth-admin.test.ts**: Testa as rotas de administração
  - Criação de admin (`POST /auth/admin`)
  - Listagem de admins (`GET /auth/admin`)

### 2. Testes de Plugins (`plugins.test.ts`)
- CORS Plugin
- Rate Limiting Plugin
- JWT Plugin
- Authentication Plugin
- Role Verification Plugin

### 3. Testes de Middleware (`shared/middleware/`)
- **errorHandler.test.ts**: Testa o middleware de tratamento de erros
  - Tratamento de AppError customizado
  - Tratamento de erros de validação Zod
  - Tratamento de erros genéricos
  - Formatação de resposta de erro
  - Logging de erros

### 4. Testes de Rate Limiter (`utils/rateLimiter.test.ts`)
- **Configuração e Inicialização**:
  - Criação de instância do rate limiter
  - Configuração com diferentes parâmetros
  - Validação de configurações inválidas

- **Funcionalidades de Rate Limiting**:
  - Verificação de limites de requisições
  - Incremento de contadores
  - Reset de contadores após expiração
  - Diferentes tipos de limitação (por IP, por usuário)

- **Operações de Gerenciamento**:
  - Limpeza de rate limits (`clearRateLimit`)
  - Obtenção de estatísticas (`getRateLimitStats`)
  - Verificação de saúde do Redis (`checkRedisHealth`)

- **Tratamento de Erros**:
  - Falhas de conexão com Redis
  - Timeouts de operação
  - Dados inválidos

### 5. Testes de Utilitários Gerais (`utils.test.ts`)
- Validação de email
- Constantes da aplicação

### 6. Testes End-to-End (`e2e/`)
- **auth.e2e.test.ts**: Testes completos de fluxo de autenticação
  - Fluxo completo de login/logout
  - Integração com banco de dados real
  - Testes de sessão e cookies

## Configuração

### Variáveis de Ambiente
Os testes usam um arquivo `.env.test` para configurações específicas:

```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-tests-1234567890abcdefg!
ADMIN_SECRET=test_admin_secret_12345

# Database (use um banco separado para testes)
DATABASE_URL="postgresql://user:password@localhost:5432/yourapp_test"

# Google OAuth
GOOGLE_CLIENT_ID=test_google_client_id
GOOGLE_CLIENT_SECRET=test_google_client_secret

# CORS
CORS_ORIGIN=http://localhost:3000

# Redis para testes (valores mock)
UPSTASH_REDIS_REST_URL=https://test-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=test_redis_token_12345

# Configurações específicas para testes
SILENT_TESTS=false
DISABLE_RATE_LIMIT=true
BYPASS_RATE_LIMIT=true
```

### Mocks
Os testes usam mocks para:
- **Prisma**: Simula operações de banco de dados
- **bcrypt**: Simula hash de senhas
- **Google Auth**: Simula autenticação Google
- **Redis**: Simula operações do Upstash Redis para rate limiting
- **Console**: Opcional, para testes mais limpos
- **Rate Limiter**: Mock das operações de rate limiting
- **Error Handler**: Mock do sistema de tratamento de erros

## Padrões de Teste

### Estrutura de um Teste
```typescript
describe('Nome da Funcionalidade', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = await build();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('Nome do Método', () => {
    it('should do something when condition', async () => {
      // Arrange
      const mockData = { /* dados de teste */ };
      
      // Act
      const response = await fastify.inject({
        method: 'GET',
        url: '/test',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(expectedData);
    });
  });
});
```

### Helpers Disponíveis
```typescript
// Gerar token de autenticação
const token = await getAuthToken(fastify, 'user-id', 'USER');

// Criar mock de usuário
const mockUser = createMockUser({ id: 'user-id' });

// Criar mock de admin
const mockAdmin = createMockAdmin({ id: 'admin-id' });
```

## Cobertura de Testes

Os testes cobrem:
- ✅ **Rotas da aplicação** (100% das rotas principais)
- ✅ **Autenticação e autorização** (Google OAuth, JWT, sessões)
- ✅ **Validação de dados** (Zod schemas, validação de email)
- ✅ **Tratamento de erros** (100% do errorHandler)
- ✅ **Rate Limiting** (95.38% do rateLimiter)
- ✅ **Plugins e middlewares** (CORS, Auth, Rate Limit)
- ✅ **Utilitários e constantes** (validação, helpers)
- ✅ **Bibliotecas externas** (Google Auth, Prisma)
- ✅ **Testes E2E** (fluxos completos de autenticação)

### Estatísticas de Cobertura Atual:
- **errorHandler.ts**: 100% (statements, branches, functions, lines)
- **rateLimiter.ts**: 95.38% statements, 68.62% branches, 100% functions, 94.82% lines
- **AppError.ts**: 100% lines/functions, 96.15% branches
- **Rotas**: 100% das rotas principais cobertas
- **Plugins**: Cobertura variável (70-100% dependendo do plugin)

## Boas Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Limpeza**: Sempre limpar mocks entre testes
3. **Nomes Descritivos**: Use nomes claros para testes
4. **Arrange-Act-Assert**: Estruture os testes nesta ordem
5. **Mocks**: Use mocks para dependências externas
6. **Timeout**: Configure timeout adequado para testes assíncronos

## Troubleshooting

### Erro de Timeout
```bash
# Aumentar timeout no jest.config.cjs
testTimeout: 10000
```

### Erro de Módulos
```bash
# Verificar se as extensões estão corretas
import { build } from '../../src/app.js';
```

### Erro de Variáveis de Ambiente
```bash
# Criar arquivo .env.test
cp .env .env.test
# Editar valores para teste
```

### Erro de Redis (Rate Limiter)
```bash
# Verificar se as variáveis do Redis estão configuradas no .env.test
UPSTASH_REDIS_REST_URL=https://test-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=test_redis_token_12345

# Para CI/CD, verificar se as variáveis estão no workflow
```

### Erro de Mocks
```bash
# Limpar mocks entre testes
jest.clearAllMocks();

# Verificar se os mocks estão sendo aplicados corretamente
jest.mock('@upstash/redis');
```

### Erro de Cobertura
```bash
# Executar testes com cobertura detalhada
npm run test:coverage -- --verbose

# Verificar arquivos não cobertos
npm run test:coverage -- --collectCoverageFrom="src/**/*.ts"
```