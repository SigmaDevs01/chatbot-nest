// src/conversation/steps/index.ts
import { StepName } from '../session/session.types';
import { Step } from './step.interface';
import { categoriaStep } from './categoria.step';
import { descricaoStep } from './descricao.step';
import { enderecoStep } from './endereco.step';
import { coordenadasStep } from './coordenadas.step';
import { fotosStep } from './fotos.step';
import { confirmacaoStep } from './confirmacao.step';

/**
 * Registro e Dicionário de todos os passos (`STEPS`).
 *
 * Mapeia cada `StepName` ('CATEGORIA', 'DESCRICAO', etc.) para a sua respectiva implementação `Step`.
 * Permite ao `ConversationService` executar `STEPS[session.step].handle(msg, session)`
 * de forma polimórfica e dinâmica, sem encadeamentos gigantescos de `if/else`.
 */
export const STEPS: Record<StepName, Step> = {
  CATEGORIA: categoriaStep,
  DESCRICAO: descricaoStep,
  ENDERECO: enderecoStep,
  COORDENADAS: coordenadasStep,
  FOTOS: fotosStep,
  CONFIRMACAO: confirmacaoStep,
};
