// src/messaging/messenger.ts

/**
 * Contrato (Interface) para qualquer mecanismo de envio de mensagens do WhatsApp.
 *
 * Permite que a aplicação desacople a lógica de negócios da biblioteca/API de envio real.
 */
export interface Messenger {
  /**
   * Envia uma mensagem de texto simples para um número de WhatsApp.
   *
   * @param number - Número de telefone com DDI e DDD (ex: "5511999999999").
   * @param text - Conteúdo da mensagem de texto a ser enviada.
   */
  sendText(number: string, text: string): Promise<void>;
}

/**
 * Token de Injeção de Dependência para a interface `Messenger`.
 * No NestJS, interfaces TypeScript desaparecem em tempo de execução, então usamos
 * um Symbol ou string para injetar implementações via `@Inject(MESSENGER)`.
 */
export const MESSENGER = Symbol('MESSENGER');
