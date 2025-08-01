import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyCorsOptions } from '@fastify/cors';

export default fp(async (app) => {
  // Configuração mais robusta baseada no ambiente
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTest = process.env.NODE_ENV === 'test'

  // Parse das origens permitidas
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || []

  // Configuração dinâmica baseada no ambiente
  let originConfig: FastifyCorsOptions['origin']

  if (isDevelopment || isTest) {
    // Em desenvolvimento/teste: permite qualquer origem
    originConfig = true
  } else if (allowedOrigins.length > 0) {
    // Em produção: usa origens específicas
    originConfig = allowedOrigins
  } else {
    // Fallback seguro: bloqueia tudo se não houver configuração
    originConfig = false
  }

  const options: FastifyCorsOptions = {
    origin: originConfig,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true,
    maxAge: isDevelopment ? 600 : 86400, // Cache menor em dev
    optionsSuccessStatus: 204, // Fix: Forçar 204 para OPTIONS
    preflightContinue: false, // Fix: Não passar para próximo handler
  };

  // Log da configuração (apenas em desenvolvimento)
  if (isDevelopment) {
    app.log.info({
      cors: {
        origin: originConfig,
        allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : 'all',
        optionsSuccessStatus: 204
      }
    }, 'CORS configuration loaded')
  }

  await app.register(cors, options);
});