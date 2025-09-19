import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:8080', 
      'http://127.0.0.1:8080',
      // Add your machine's IP for LAN testing
      'http://192.168.0.106:8080', // Your actual IP
      // Allow all origins for testing (not recommended for production)
      /^http:\/\/192\.168\.\d+\.\d+:8080$/, // Allow any 192.168.x.x:8080
      /^http:\/\/10\.\d+\.\d+\.\d+:8080$/, // Allow any 10.x.x.x:8080
    ],
    credentials: true,
  });
  
  // Configure Socket.IO
  app.useWebSocketAdapter(new IoAdapter(app));
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API Server is running on http://localhost:${port}`);
  console.log(`API Server is also accessible on http://192.168.0.106:${port}`);
  console.log('WebSocket Gateway is enabled');
}
bootstrap();
