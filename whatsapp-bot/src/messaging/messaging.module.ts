// src/messaging/messaging.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MESSENGER } from './messenger';
import { ConsoleMessenger } from './console.messenger';
import { EvolutionClient } from './evolution.client';

/**
 * Módulo de Mensageria (MessagingModule).
 * Provê o ConsoleMessenger para simulações locais ou o EvolutionClient para instâncias reais da Evolution API.
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
      ) => {
        const isSimulation = config.get('SIMULATION_MODE') === 'true';
        const useFake = config.get('USE_FAKE_MESSENGER') === 'true';
        if (useFake || (isSimulation && !config.get('EVOLUTION_URL'))) {
          return fake;
        }
        return real;
      },
    },
  ],
  exports: [MESSENGER, EvolutionClient],
})
export class MessagingModule {}
