// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Função de inicialização da aplicação NestJS.
 * - Cria a instância do servidor HTTP com base no AppModule.
 * - Inicia o servidor escutando na porta definida na variável de ambiente PORT (ou 3001 como padrão).
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Permite aos providers liberar a conexão Redis e os timers no encerramento.
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`🚀 Bot WhatsApp iniciado e ouvindo na porta ${port}`);
}

void bootstrap();
