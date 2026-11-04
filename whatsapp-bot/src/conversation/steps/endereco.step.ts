// src/conversation/steps/endereco.step.ts
import { messages } from '../messages';
import { Step } from './step.interface';

/**
 * Passo 3: Endereço Textual do Problema.
 *
 * Regras:
 * - O endereço textual é obrigatório (rua, número, bairro ou ponto de referência).
 * - Exige um comprimento mínimo de 5 caracteres.
 * - Ao validar, salva o endereço no rascunho (`session.draft.address`) e avança para 'COORDENADAS'.
 */
export const enderecoStep: Step = {
  prompt: () => messages.endereco(),

  handle(msg, session) {
    const text = msg.text?.trim() ?? '';

    if (text.length < 5) {
      return {
        type: 'stay',
        message: 'O endereço é obrigatório. Informe rua, número e bairro.',
      };
    }

    session.draft.address = text;
    return { type: 'next', next: 'COORDENADAS' };
  },
};
