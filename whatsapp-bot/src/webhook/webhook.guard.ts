import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

/**
 * Exige segredo compartilhado antes de processar qualquer evento do webhook.
 * Compatível com Evolution API: aceita x-webhook-token, apikey ou Authorization Bearer.
 */
@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const expectedToken = this.config.get<string>('WEBHOOK_TOKEN');
    const evolutionApiKey = this.config.get<string>('EVOLUTION_APIKEY');

    if (!expectedToken && !evolutionApiKey) {
      return true;
    }

    const rawHeader =
      req.headers['x-webhook-token'] ||
      req.headers['apikey'] ||
      req.headers['webhook-token'] ||
      req.headers['authorization'] ||
      (req.query?.['token'] as string | undefined);

    if (!rawHeader || typeof rawHeader !== 'string') {
      throw new UnauthorizedException('Token do webhook ausente');
    }

    const token = rawHeader.replace(/^Bearer\s+/i, '').trim();

    const matchesExpected = expectedToken && this.safeCompare(token, expectedToken);
    const matchesEvolutionKey = evolutionApiKey && this.safeCompare(token, evolutionApiKey);

    if (!matchesExpected && !matchesEvolutionKey) {
      throw new UnauthorizedException('Token do webhook inválido');
    }

    return true;
  }

  private safeCompare(a: string, b: string): boolean {
    const hashA = createHash('sha256').update(a).digest();
    const hashB = createHash('sha256').update(b).digest();
    return timingSafeEqual(hashA, hashB);
  }
}
