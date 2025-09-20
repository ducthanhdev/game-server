import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors({
    origin: [
      'http://localhost:8080', 
      'http://127.0.0.1:8080',
      'http://192.168.0.106:8080',
      /^http:\/\/192\.168\.\d+\.\d+:8080$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:8080$/,
    ],
    credentials: true,
  });
  
  app.useWebSocketAdapter(new IoAdapter(app));
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on port ${port}`);
}
bootstrap();
