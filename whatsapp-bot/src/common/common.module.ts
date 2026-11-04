import { Global, Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { StateService } from './state.service';
/** Compartilha uma única persistência e um único coordenador de entrega no processo. */
@Global()
@Module({
  providers: [StateService, IdempotencyService],
  exports: [StateService, IdempotencyService],
})
export class CommonModule {}
