import './polyfills';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

async function bootstrap() {
  let httpsOptions: https.ServerOptions | undefined = undefined;

  // Configuración HTTPS para producción
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SSL_CERT_PATH &&
    process.env.SSL_KEY_PATH
  ) {
    try {
      httpsOptions = {
        key: fs.readFileSync(path.resolve(process.env.SSL_KEY_PATH)),
        cert: fs.readFileSync(path.resolve(process.env.SSL_CERT_PATH)),
      };
      console.log('SSL certificates loaded successfully');
    } catch (error) {
      console.error('Error loading SSL certificates:', error);
      console.log('Falling back to HTTP mode');
    }
  }
  const app = await NestFactory.create(
    AppModule,
    httpsOptions ? { httpsOptions } : {},
  );
  const configService = app.get(ConfigService);

  // Configuración global de pipes para validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Configuración de CORS con opciones más específicas para HTTPS
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://145.79.1.115:3001',
        'https://145.79.1.115:3001',
        'https://mvasrl.com'
      ].filter(Boolean);
      
      // Permitir requests sin origin (como Postman, aplicaciones móviles)
      if (!origin) return callback(null, true);
      
      console.log('Origin recibido:', origin);
      console.log('Orígenes permitidos:', allowedOrigins);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configuración de prefijo global para la API
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  const protocol = httpsOptions ? 'https' : 'http';
  console.log(`Application running on port ${port}`);
  console.log(`API available at ${protocol}://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
