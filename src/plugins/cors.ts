import fp from 'fastify-plugin';
import cors from '@fastify/cors'; // ou 'fastify-cors'
import type { FastifyCorsOptions } from '@fastify/cors';

export default fp(async (app) => {
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];

  const options: FastifyCorsOptions = {
    origin: true, // Simplificando para permitir qualquer origem durante o desenvolvimento
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  };

  await app.register(cors, options);
});
