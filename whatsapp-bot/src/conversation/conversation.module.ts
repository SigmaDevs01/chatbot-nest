// src/conversation/conversation.module.ts
import { Module } from '@nestjs/common';
import { BackendModule } from '../backend/backend.module';
import { MessagingModule } from '../messaging/messaging.module';
import { StorageModule } from '../storage/storage.module';
import { ConversationService } from './conversation.service';
import { PersistentSessionStore } from './session/persistent-session.store';
import { SESSION_STORE } from './session/session.store';

/**
 * Módulo de Conversação (ConversationModule).
 *
 * Centraliza o motor do chatbot e suas dependências:
 * - `BackendModule`: Para submeter o chamado na API.
 * - `MessagingModule`: Para disparo de mensagens.
 * - `StorageModule`: Para upload de fotos no Supabase.
 * - `SESSION_STORE`: Injeta o `PersistentSessionStore` como implementação de armazenamento de sessão.
 *
 * Exporta o `ConversationService` para que o `WebhookModule` possa invocá-lo ao receber mensagens.
 */
@Module({
  imports: [BackendModule, MessagingModule, StorageModule],
  providers: [
    ConversationService,
    { provide: SESSION_STORE, useClass: PersistentSessionStore },
  ],
  exports: [ConversationService],
})
export class ConversationModule {}
