import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true
  });
  app.setGlobalPrefix('api');
  await app.listen(3000);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
