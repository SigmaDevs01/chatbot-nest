import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MESSENGER, type Messenger } from '../messaging/messenger';
import { IdempotencyService } from '../common/idempotency.service';
import { ConversationService } from '../conversation/conversation.service';
import { WebhookGuard } from './webhook.guard';
import { parseWebhook } from './webhook.parser';
/**
 * Entrada HTTP: autenticar → normalizar → deduplicar → conversar → entregar.
 * A resposta ao cidadão é enviada pelo Messenger; o JSON HTTP é para a Evolution.
 */
@Controller('webhook')
@UseGuards(WebhookGuard)
export class WebhookController {
  constructor(
    @Inject(MESSENGER) private readonly messenger: Messenger,
    private readonly idempotency: IdempotencyService,
    private readonly conversation: ConversationService,
    private readonly config: ConfigService,
  ) {}
  /**
   * Retorna 200 para evento ignorado, duplicado ou concluído.
   * Erros de processamento/entrega propagam para que o provedor possa tentar de novo.
   */
  @Post()
  @HttpCode(200)
  async handle(@Body() body: unknown) {
    const msg = parseWebhook(body);
    if (!msg) return { ignored: true };
    // Uma implantação atende a instância configurada, não um tenant escolhido no corpo.
    const instance =
      this.config.get<string>('EVOLUTION_INSTANCE') ?? 'simulation';
    return this.idempotency.deliver(
      `${instance}:${msg.from}`,
      msg.id,
      () => this.conversation.handle(msg),
      (reply) => this.messenger.sendText(msg.from, reply),
    );
  }
}
