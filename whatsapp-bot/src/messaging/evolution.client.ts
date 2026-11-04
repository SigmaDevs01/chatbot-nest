import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Messenger } from './messenger';
import { IncomingMessage } from '../webhook/dto/incoming-message';

const MAX_BYTES = 5 * 1024 * 1024;

/** Transporte HTTP da Evolution API: envio de texto e download de imagem. */
@Injectable()
export class EvolutionClient implements Messenger {
  private readonly logger = new Logger(EvolutionClient.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  /** Usa a instância configurada e codifica seu nome como segmento da URL. */
  private endpoint(path: string) {
    return `${this.config.getOrThrow<string>('EVOLUTION_URL').replace(/\/$/, '')}/${path}/${encodeURIComponent(this.config.getOrThrow<string>('EVOLUTION_INSTANCE'))}`;
  }

  /** Timeout finito evita manter indefinidamente um webhook/bloqueio ocupado. */
  private options() {
    return {
      headers: { apikey: this.config.getOrThrow<string>('EVOLUTION_APIKEY') },
      timeout: 15000,
    };
  }

  /** Propaga falhas ao chamador para preservar a resposta pendente de reenvio. */
  async sendText(number: string, text: string): Promise<void> {
    const cleanNumber = number.replace(/\D/g, '');
    try {
      await firstValueFrom(
        this.http.post(
          this.endpoint('message/sendText'),
          { number: cleanNumber, text },
          this.options(),
        ),
      );
      this.logger.log(`Mensagem enviada com sucesso para ${cleanNumber} via Evolution API`);
    } catch (err: any) {
      const details = err.response?.data || err.message;
      this.logger.error(`Falha ao enviar mensagem para ${cleanNumber} via Evolution API:`, details);
      throw err;
    }
  }

  /**
   * Busca a mídia pela chave da mensagem, sem abrir URLs recebidas no webhook.
   */
  async downloadPhoto(
    msg: IncomingMessage,
  ): Promise<{ buffer: Buffer; mimetype: string }> {
    const cleanNumber = msg.from.replace(/\D/g, '');
    const res = await firstValueFrom(
      this.http.post<{ base64?: unknown; mimetype?: unknown }>(
        this.endpoint('chat/getBase64FromMediaMessage'),
        {
          message: {
            key: {
              id: msg.id,
              remoteJid: `${cleanNumber}@s.whatsapp.net`,
              fromMe: false,
            },
          },
          convertToMp4: false,
        },
        { ...this.options(), maxContentLength: 8 * 1024 * 1024 },
      ),
    );
    const data = res.data;
    if (typeof data.base64 !== 'string')
      throw new Error('Evolution não retornou a imagem');
    const base64 = data.base64.replace(/^data:[^;]+;base64,/, '');
    if (
      !base64 ||
      base64.length > Math.ceil(MAX_BYTES / 3) * 4 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
    )
      throw new Error('Imagem inválida ou maior que 5 MB');
    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length || buffer.length > MAX_BYTES)
      throw new Error('Imagem maior que 5 MB');
    return {
      buffer,
      mimetype:
        typeof data.mimetype === 'string'
          ? data.mimetype
          : (msg.mimetype ?? ''),
    };
  }
}
