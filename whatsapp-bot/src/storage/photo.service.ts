import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvolutionClient } from '../messaging/evolution.client';
import { IncomingMessage } from '../webhook/dto/incoming-message';
import { StorageService } from './storage.service';

/** Faz a ponte entre o download autenticado da Evolution e o upload no Supabase. */
@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly evolution: EvolutionClient,
    private readonly storage: StorageService,
  ) {}

  /**
   * Retorna a URL da foto. Caso o Supabase não esteja configurado, devolve uma referência
   * para não quebrar a conversa do cidadão.
   */
  async upload(msg: IncomingMessage): Promise<string> {
    if (this.config.get('SIMULATION_MODE') === 'true')
      return `https://simulation.invalid/${encodeURIComponent(msg.id)}.jpg`;

    if (!this.config.get('SUPABASE_URL') || !this.config.get('SUPABASE_SERVICE_ROLE_KEY')) {
      this.logger.warn('Supabase não configurado no bot. Foto registrada com URL de referência.');
      return `https://storage.local/whatsapp/${encodeURIComponent(msg.id)}.jpg`;
    }

    const { buffer, mimetype } = await this.evolution.downloadPhoto(msg);
    return this.storage.uploadPhoto(
      buffer,
      mimetype,
      `${this.config.get<string>('EVOLUTION_INSTANCE')}:${msg.from}:${msg.id}`,
    );
  }
}
