# Testes da Aplicação

Este diretório contém todos os testes da aplicação, organizados por funcionalidade.

## Estrutura dos Testes

```
tests/
├── routes/           # Testes das rotas da aplicação
│   ├── index.test.ts     # Testes das rotas principais
│   ├── auth.test.ts      # Testes das rotas de autenticação
│   └── auth-admin.test.ts # Testes das rotas de admin
├── plugins.test.ts   # Testes dos plugins
├── utils.test.ts     # Testes dos utilitários
├── setup.ts          # Configuração global dos testes
├── test-setup.ts     # Setup específico para testes
└── utils/            # Utilitários para testes
    ├── helpers.ts    # Funções auxiliares para testes
    └── mocks.ts      # Mocks para testes
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

### 3. Testes de Utilitários (`utils.test.ts`)
- Validação de email
- Constantes da aplicação

## Configuração

### Variáveis de Ambiente
Os testes usam um arquivo `.env.test` para configurações específicas:

```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key
ADMIN_SECRET=test_admin_secret_12345
GOOGLE_CLIENT_ID=test-google-client-id
GOOGLE_CLIENT_SECRET=test-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Mocks
Os testes usam mocks para:
- **Prisma**: Simula operações de banco de dados
- **bcrypt**: Simula hash de senhas
- **Google Auth**: Simula autenticação Google
- **Console**: Opcional, para testes mais limpos

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
- ✅ Todas as rotas da aplicação
- ✅ Autenticação e autorização
- ✅ Validação de dados
- ✅ Tratamento de erros
- ✅ Plugins e middlewares
- ✅ Utilitários e constantes

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