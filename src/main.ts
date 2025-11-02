import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar ValidationPipe globalmente para transformar tipos automaticamente
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Transforma tipos automaticamente (string -> Date, etc)
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Retorna erro se propriedades não definidas forem enviadas
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.port;

  await app.listen(port);
  console.log(`🚀 Family Task Manager API rodando na porta ${port}`);
}
bootstrap();
