// src/conversation/steps/step.interface.ts
import { IncomingMessage } from '../../webhook/dto/incoming-message';
import { Session, StepName } from '../session/session.types';

/**
 * Resultado da avaliação de uma mensagem em qualquer passo da conversa:
 * - `next`: Entrada válida; avança para o próximo passo especificado.
 * - `stay`: Entrada inválida ou envio parcial de dados; permanece no mesmo passo e devolve uma mensagem de orientação/erro.
 * - `cancel`: Usuário solicitou encerramento ou recusou a confirmação.
 * - `finish`: Usuário confirmou todos os dados; pronto para enviar ao backend.
 */
export type StepResult =
  | { type: 'next'; next: StepName }
  | { type: 'stay'; message: string }
  | { type: 'cancel' }
  | { type: 'finish' };

/**
 * Contrato (Interface) que cada passo da conversa deve implementar.
 *
 * Segue o padrão de projeto State / Strategy, isolando as regras de validação
 * de cada pergunta em arquivos independentes.
 */
export interface Step {
  /**
   * Retorna o texto da pergunta ou orientação apresentada ao usuário ao entrar neste passo.
   * @param session - Sessão atual (útil quando o prompt depende de dados já preenchidos, ex: resumo).
   */
  prompt(session: Session): string;

  /**
   * Processa a mensagem enviada pelo usuário em resposta a este passo.
   *
   * @param msg - Mensagem recebida (texto, localização, foto, etc.).
   * @param session - Sessão do usuário (pode ter seu `draft` modificado diretamente com a resposta).
   * @returns Um `StepResult` indicando se deve avançar, permanecer, cancelar ou finalizar.
   */
  handle(msg: IncomingMessage, session: Session): StepResult;
}
