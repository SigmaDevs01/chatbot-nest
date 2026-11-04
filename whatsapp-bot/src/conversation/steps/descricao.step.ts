// src/conversation/steps/descricao.step.ts
import { messages } from '../messages';
import { Step } from './step.interface';

/**
 * Passo 2: Descrição Detalhada do Problema.
 *
 * Regras:
 * - Exige um texto explicativo com no mínimo 10 caracteres para evitar denúncias vagas.
 * - Ao validar, salva a descrição no rascunho (`session.draft.description`) e avança para 'ENDERECO'.
 */
export const descricaoStep: Step = {
  prompt: () => messages.descricao(),

  handle(msg, session) {
    const text = msg.text?.trim() ?? '';

    // Validação de tamanho mínimo
    if (text.length < 10) {
      return {
        type: 'stay',
        message:
          'Descreva com um pouco mais de detalhe (mínimo 10 caracteres).',
      };
    }

    session.draft.description = text;
    return { type: 'next', next: 'ENDERECO' };
  },
};
