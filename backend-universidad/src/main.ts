// src/main.ts

// 1. PARCHE DE CRYPTO (OBLIGATORIO PARA NODE 18)
import * as crypto from 'crypto';
if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as path from 'path';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());

  // --- CORRECCIÓN DE RUTAS ESTÁTICAS ---
  // Si tu URL externa es /api/uploads/..., y tu prefijo global es 'v1',
  // lo más seguro es servirlo de forma que ignore el prefijo o coincida con Nginx.
app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  // Si tu frontend busca /api/... asegúrate que el prefijo sea 'api' y no 'v1'
  // Cambié 'v1' por 'api' para que coincida con tu error 404
 app.setGlobalPrefix('v1');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        'http://localhost:3012',
	'http://localhost:3013',
        'https://universidad.ppollo.org',
        'http://194.113.64.53:3012',
        'app://.'
      ];
      if (allowedOrigins.includes(origin) || origin.startsWith('app://')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-user-username', 'x-user-department'],
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 3013;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Servidor listo en puerto ${port}`);
}
bootstrap();
