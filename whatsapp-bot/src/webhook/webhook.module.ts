// src/webhook/webhook.module.ts
import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { CommonModule } from '../common/common.module';
import { WebhookController } from './webhook.controller';
import { WebhookGuard } from './webhook.guard';
import { ConversationModule } from '../conversation/conversation.module';

/**
 * Módulo de Webhook (WebhookModule).
 *
 * Agrupa o controller e guard responsáveis pela recepção das mensagens do WhatsApp.
 *
 * Importações:
 * - MessagingModule: Para injetar o provedor de envio de respostas (MESSENGER).
 * - CommonModule: Para injetar o IdempotencyService (anti-duplicação).
 * - ConversationModule: Para conectar o fluxo conversacional da máquina de estados.
 */
@Module({
  imports: [MessagingModule, CommonModule, ConversationModule],
  controllers: [WebhookController],
  providers: [WebhookGuard],
})
export class WebhookModule {}
