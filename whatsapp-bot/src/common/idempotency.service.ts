import { Injectable } from '@nestjs/common';
import { StateService } from './state.service';
/** Resposta já calculada e confirmação local de entrega ao provedor. */
interface Delivery {
  reply: string;
  sent: boolean;
}
/** Janela de deduplicação: mensagens mais antigas podem ser processadas novamente. */
const TTL_MS = 24 * 60 * 60 * 1000;
/**
 * Coordena processamento e entrega sem avançar duas vezes uma etapa em retries.
 * Uma resposta pendente é reutilizada; uma entrega marcada como enviada é ignorada.
 * O provedor ainda pode duplicar a mensagem se aceitar o envio e perder o ACK.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly state: StateService) {}
  /**
   * @param user Identificador composto por instância Evolution e telefone.
   * @param id ID original da mensagem; deve permanecer igual em um retry.
   * @param process Calcula a resposta e atualiza a sessão dentro da transação.
   * @param send Envia a resposta persistida para o WhatsApp.
   */
  async deliver(
    user: string,
    id: string,
    process: () => Promise<string>,
    send: (reply: string) => Promise<void>,
  ) {
    return this.state.withLock(`user:${user}`, async () => {
      const key = `delivery:${user}:${id}`;
      let delivery = await this.state.get<Delivery>(key);
      if (delivery?.sent) return { duplicate: true };
      if (!delivery) {
        delivery = await this.state.transaction(async () => {
          const pending = { reply: await process(), sent: false };
          await this.state.set(key, pending, TTL_MS);
          return pending;
        });
      }
      // Só envia depois de persistir sessão + resposta. Se falhar, sent continua false.
      // O webhook retorna erro para permitir que a Evolution repita o mesmo ID.
      await send(delivery.reply);
      await this.state.set(key, { ...delivery, sent: true }, TTL_MS);
      return { ok: true };
    });
  }
}
