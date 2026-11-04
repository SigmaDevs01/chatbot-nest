import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvolutionClient } from '../messaging/evolution.client';
import { IncomingMessage } from '../webhook/dto/incoming-message';
import { StorageService } from './storage.service';
/** Faz a ponte entre o download autenticado da Evolution e o upload no Supabase. */
@Injectable()
export class PhotoService {
  constructor(
    private readonly config: ConfigService,
    private readonly evolution: EvolutionClient,
    private readonly storage: StorageService,
  ) {}
  /**
   * Retorna apenas a URL; o rascunho não guarda buffers ou conteúdo base64.
   * Em simulação, .invalid torna explícito que o endereço não é uma foto real.
   * Erros são tratados pelo ConversationService sem contabilizar a imagem.
   */
  async upload(msg: IncomingMessage): Promise<string> {
    if (this.config.get('SIMULATION_MODE') === 'true')
      return `https://simulation.invalid/${encodeURIComponent(msg.id)}.jpg`;
    const { buffer, mimetype } = await this.evolution.downloadPhoto(msg);
    return this.storage.uploadPhoto(
      buffer,
      mimetype,
      `${this.config.get<string>('EVOLUTION_INSTANCE')}:${msg.from}:${msg.id}`,
    );
  }
}
