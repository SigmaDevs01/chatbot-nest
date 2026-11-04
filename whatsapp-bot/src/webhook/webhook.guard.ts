import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
/** Exige o segredo compartilhado no cabeçalho antes de processar qualquer evento. */
@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  /** Recusa cabeçalho ausente/múltiplo; compara buffers de mesmo tamanho em tempo constante. */
  canActivate(ctx: ExecutionContext): boolean {
    const incoming = ctx.switchToHttp().getRequest<Request>().headers[
      'x-webhook-token'
    ];
    const expected = this.config.get<string>('WEBHOOK_TOKEN');
    if (typeof incoming !== 'string' || !expected)
      throw new UnauthorizedException('Token inválido ou ausente');
    // timingSafeEqual exige buffers de comprimentos iguais; conferir antes evita exceção.
    const a = Buffer.from(incoming),
      b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      throw new UnauthorizedException('Token inválido ou ausente');
    return true;
  }
}
