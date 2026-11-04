import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { BackendError } from './backend.error';
import { CreateComplaintPayload } from './dto/create-complaint.payload';
/** Único cliente de criação de denúncias; concentra autenticação e contrato HTTP. */
@Injectable()
export class BackendClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}
  /**
   * Envia um rascunho validado e só aceita sucesso com protocolo não vazio.
   * O backend deve implementar Idempotency-Key: enviar o cabeçalho, sozinho,
   * não evita duplicações quando a resposta HTTP se perde após a criação.
   * A simulação retorna uma referência identificada sem fazer chamada externa.
   * @throws BackendError com status e detalhes úteis para correção/reenvio.
   */
  async createComplaint(
    payload: CreateComplaintPayload,
    idempotencyKey: string,
  ): Promise<{ id: string }> {
    if (this.config.get('SIMULATION_MODE') === 'true')
      return { id: `SIMULADO-${idempotencyKey.slice(0, 12)}` };
    try {
      const res = await firstValueFrom(
        this.http.post<unknown>(
          `${this.config.getOrThrow<string>('BACKEND_URL').replace(/\/$/, '')}/bot/complaints`,
          payload,
          {
            headers: {
              'x-bot-key': this.config.getOrThrow<string>('BOT_API_KEY'),
              'Idempotency-Key': idempotencyKey,
            },
            timeout: 15000,
          },
        ),
      );
      // Tipos TypeScript não garantem que a resposta externa respeita o contrato.
      const data = res.data as { id?: unknown } | null;
      if (!data || typeof data.id !== 'string' || !data.id.trim())
        throw new BackendError(
          undefined,
          'Backend não retornou protocolo válido',
        );
      return { id: data.id };
    } catch (e) {
      if (e instanceof BackendError) throw e;
      if (!isAxiosError<{ message?: unknown }>(e))
        throw new BackendError(undefined, 'Falha na comunicação com o backend');
      const msg = e.response?.data?.message;
      // Mensagens de validação podem ser uma string ou uma lista de strings.
      const details = Array.isArray(msg)
        ? msg.filter((v): v is string => typeof v === 'string').join('\n')
        : typeof msg === 'string'
          ? msg
          : 'Falha na comunicação com o backend';
      throw new BackendError(e.response?.status, details);
    }
  }
}
