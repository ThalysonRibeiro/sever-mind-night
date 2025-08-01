# Fluxo de Trabalho de Testes da Aplicação

Este documento descreve a estratégia de testes adotada neste projeto, utilizando duas camadas principais: Testes de Integração (com Mocks) e Testes End-to-End (E2E).

## 1. Visão Geral

Utilizamos uma abordagem de duas camadas para equilibrar velocidade de desenvolvimento, cobertura de código e confiança na aplicação.

### Testes de Integração (com Mocks)

-   **Localização**: `tests/routes`
-   **Propósito**: Testar a lógica da aplicação (rotas, controladores, serviços) de forma rápida e isolada. Eles garantem que o código se comporta como esperado, sem depender de sistemas externos como o banco de dados.
-   **Como funciona**: Simula (faz "mock") as dependências externas, como o Prisma Client e serviços de terceiros. Foca em validar a lógica de negócios, validações de entrada e tratamento de erros.

### Testes End-to-End (E2E)

-   **Localização**: `tests/e2e`
-   **Propósito**: Garantir que todas as partes do sistema funcionam corretamente em conjunto. Simula uma requisição real de um cliente, passando por todas as camadas da aplicação até o banco de dados.
-   **Como funciona**: Utiliza um banco de dados de teste real (gerenciado via Docker) para validar o fluxo completo, desde a requisição HTTP até a persistência e consulta dos dados.

---

## 2. O Fluxo de Trabalho Ideal

Ao desenvolver uma nova funcionalidade, como uma nova rota, siga estes passos:

### Passo 1: Desenvolvimento com Testes de Integração (Rápidos e com Mocks)

1.  **Crie o arquivo de teste**: Ex: `tests/routes/diaries.test.ts`.
2.  **Escreva os testes primeiro (TDD)**: Cubra todos os cenários possíveis, mockando os serviços:
    -   Testes de autenticação (`deve retornar 401 se o usuário não estiver autenticado`).
    -   Testes de validação (`deve retornar 400 se faltar um campo obrigatório`).
    -   Testes de lógica (`deve chamar o service com os parâmetros corretos`).
    -   Testes de sucesso (`deve retornar 201 e o objeto criado`).
3.  **Implemente a funcionalidade**: Crie a rota, o controlador e o serviço, fazendo os testes passarem um a um.
4.  **Execute os testes**: Rode `npm run test:routes` (ou um script mais específico) frequentemente para ter feedback rápido.

*Neste ponto, você tem alta confiança de que a **lógica** do seu código está correta.*

### Passo 2: Verificação com Teste E2E (Completo e com Banco de Dados Real)

1.  **Abra (ou crie) o arquivo de teste E2E**: Ex: `tests/e2e/diaries.e2e.test.ts`.
2.  **Escreva um teste para o "caminho feliz"**: Adicione um único teste para o fluxo principal e de sucesso.
    -   `it('deve criar um diário no banco de dados e retorná-lo')`
3.  **Implemente o teste E2E**: 
    -   Crie os dados necessários no banco de teste (ex: um usuário).
    -   Faça uma chamada **real** à API, com um token de autenticação válido.
    -   Verifique a resposta HTTP (status e corpo).
    -   **Consulte o banco de dados de teste** para garantir que os dados foram persistidos corretamente.

*Neste ponto, você tem alta confiança de que a **integração** entre as partes do sistema está correta.*

---

## 3. Resumo da Estratégia

| Quando você...                               | Escreva um Teste de Integração (com Mock) para...                               | E escreva um Teste E2E para...                                                                 |
| :------------------------------------------- | :------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------- |
| **Cria uma nova feature/rota**               | ...testar todos os detalhes, validações, erros e casos de borda da sua lógica.  | ...garantir que o fluxo principal e feliz funciona de ponta a ponta, incluindo o banco de dados. |
| **Corrige um bug na lógica de um serviço**   | ...replicar o bug e garantir que a correção funciona.                           | ...provavelmente não é necessário, a menos que o bug estivesse relacionado à integração.         |
| **Altera o schema do Prisma**                | ...não é o foco principal, pois eles usam mocks.                                | ...**verificar se as rotas que usam as tabelas alteradas ainda funcionam corretamente.**         |

Seguir este fluxo proporciona o melhor dos dois mundos: a velocidade dos testes com mocks durante o desenvolvimento e a segurança dos testes E2E para garantir a estabilidade da aplicação como um todo.
