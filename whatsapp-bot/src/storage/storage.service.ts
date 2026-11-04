import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
/** Lista permitida; MIME desconhecido não recebe extensão padrão. */
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
/** Valida imagens e grava objetos com nomes opacos, sem telefone na URL. */
@Injectable()
export class StorageService {
  /** Inicialização adiada: iniciar a simulação não exige credenciais Supabase. */
  private client?: SupabaseClient;
  constructor(private readonly config: ConfigService) {}
  /**
   * @param buffer Conteúdo binário já baixado da Evolution.
   * @param mimetype Tipo informado pela mídia; deve combinar com a assinatura.
   * @param messageKey Identidade composta da mensagem, usada no nome determinístico.
   * @returns URL pública; o bucket precisa ser público para o contrato atual.
   * A assinatura é uma verificação básica, não decodificação completa/antivírus.
   */
  async uploadPhoto(
    buffer: Buffer,
    mimetype: string,
    messageKey: string,
  ): Promise<string> {
    const ext = EXT[mimetype];
    const valid =
      mimetype === 'image/jpeg'
        ? buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
        : mimetype === 'image/png'
          ? buffer
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : mimetype === 'image/webp' &&
            buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'WEBP';
    if (!ext || !valid || buffer.length > 5 * 1024 * 1024)
      throw new Error('Formato ou tamanho de imagem inválido');
    this.client ??= createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: { persistSession: false },
        global: {
          fetch: (url: RequestInfo | URL, options?: RequestInit) =>
            fetch(url, { ...options, signal: AbortSignal.timeout(15000) }),
        },
      },
    );
    const bucket = this.config.getOrThrow<string>('SUPABASE_BUCKET');
    // Mesma identidade e bytes produzem o mesmo caminho. upsert permite retry
    // sem criar vários objetos para o mesmo upload; não é uma limpeza de órfãos.
    const hash = createHash('sha256')
      .update(messageKey)
      .update(buffer)
      .digest('hex');
    const path = `whatsapp/${hash}.${ext}`;
    const { error } = await this.client.storage
      .from(bucket)
      .upload(path, buffer, { contentType: mimetype, upsert: true });
    if (error) throw error;
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
}
