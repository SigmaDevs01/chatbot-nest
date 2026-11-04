// src/conversation/steps/categoria.step.ts
import { VALID_CATEGORIES } from '../categories';
import { messages } from '../messages';
import { normalize } from '../text.util';
import { Step } from './step.interface';

/**
 * Passo 1: Seleção da Categoria do Problema.
 *
 * Regras:
 * - O usuário pode responder tanto com o NÚMERO da opção (1 a 11) quanto com o NOME da categoria.
 * - Se a resposta for inválida, permanece no passo e repete as opções disponíveis.
 * - Ao validar, salva a categoria oficial no rascunho (`session.draft.category`) e avança para 'DESCRICAO'.
 */
export const categoriaStep: Step = {
  prompt: () => messages.categoria(),

  handle(msg, session) {
    const text = msg.text?.trim() ?? '';
    const n = Number(text);

    // Se o usuário digitou um número inteiro, busca pelo índice (1-indexed)
    const chosen = Number.isInteger(n)
      ? VALID_CATEGORIES[n - 1]
      : VALID_CATEGORIES.find((c) => normalize(c) === normalize(text));

    // Se não encontrou nenhuma categoria correspondente
    if (!chosen) {
      return {
        type: 'stay',
        message:
          'Opção inválida. Responda com o número da lista.\n\n' +
          messages.categoria(),
      };
    }

    // Armazena a categoria no draft e avança
    session.draft.category = chosen;
    return { type: 'next', next: 'DESCRICAO' };
  },
};
