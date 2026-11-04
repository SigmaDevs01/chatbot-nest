// src/backend/backend.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BackendClient } from './backend.client';

/**
 * Módulo de Integração com o Backend (BackendModule).
 *
 * Configura o cliente HTTP e exporta o `BackendClient` para ser consumido
 * pelo `ConversationService` quando o usuário conclui o registro da denúncia.
 */
@Module({
  imports: [HttpModule],
  providers: [BackendClient],
  exports: [BackendClient],
})
export class BackendModule {}
