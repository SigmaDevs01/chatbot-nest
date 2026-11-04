// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateConfig } from './config';
import { WebhookModule } from './webhook/webhook.module';

/**
 * Módulo Raiz da Aplicação (AppModule).
 *
 * Responsabilidades:
 * 1. ConfigModule.forRoot: Carrega as variáveis de ambiente do arquivo .env
 *    e as disponibiliza globalmente em qualquer serviço via ConfigService (isGlobal: true).
 * 2. WebhookModule: Importa o ponto de entrada principal por onde chegam
 *    as mensagens encaminhadas pela Evolution API.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    WebhookModule,
  ],
})
export class AppModule {}
