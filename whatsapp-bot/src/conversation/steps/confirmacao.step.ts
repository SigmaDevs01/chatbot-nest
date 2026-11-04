// src/conversation/steps/confirmacao.step.ts
import { messages } from '../messages';
import { normalize } from '../text.util';
import { Step } from './step.interface';

/**
 * Passo 6: Confirmação e Revisão Final da Denúncia.
 *
 * Regras:
 * - O `prompt` monta um resumo completo da denúncia com categoria, descrição, endereço, coordenadas e contagem de fotos.
 * - Respostas afirmativas ("sim", "s", "confirmo"): retornam `{ type: 'finish' }` para submeter à API.
 * - Respostas negativas ("nao", "n"): retornam `{ type: 'cancel' }` descartando a denúncia.
 * - Qualquer outra resposta: solicita resposta de "sim" ou "não".
 */
export const confirmacaoStep: Step = {
  prompt: (session) => messages.confirmacao(session.draft),

  handle(msg) {
    const text = normalize(msg.text ?? '');

    // Resposta afirmativa: finaliza com sucesso
    if (['sim', 's', 'confirmo'].includes(text)) {
      return { type: 'finish' };
    }

    // Resposta negativa: cancela a sessão
    if (['nao', 'n'].includes(text)) {
      return { type: 'cancel' };
    }

    return {
      type: 'stay',
      message: 'Responda *sim* para enviar ou *não* para cancelar.',
    };
  },
};
