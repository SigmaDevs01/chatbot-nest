// src/messaging/messaging.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MESSENGER } from './messenger';
import { ConsoleMessenger } from './console.messenger';
import { EvolutionClient } from './evolution.client';

/**
 * Módulo de Mensageria (MessagingModule).
 *
 * Responsabilidades:
 * - Configura e fornece o serviço de saída de mensagens.
 * - Utiliza uma Factory (`useFactory`) para decidir dinamicamente em tempo de inicialização:
 *   - Se `SIMULATION_MODE === 'true'`: provê o `ConsoleMessenger` (simulação no terminal).
 *   - Caso contrário: provê o `EvolutionClient` (disparo real pelo WhatsApp).
 * - Exporta o token `MESSENGER` para que qualquer módulo possa injetar `@Inject(MESSENGER)`.
 */
@Module({
  imports: [HttpModule],
  providers: [
    ConsoleMessenger,
    EvolutionClient,
    {
      provide: MESSENGER,
      inject: [ConfigService, ConsoleMessenger, EvolutionClient],
      useFactory: (
        config: ConfigService,
        fake: ConsoleMessenger,
        real: EvolutionClient,
      ) => (config.get('SIMULATION_MODE') === 'true' ? fake : real),
    },
  ],
  exports: [MESSENGER, EvolutionClient],
})
export class MessagingModule {}
