// src/conversation/session/session.types.ts

/**
 * Nomes de todos os passos possíveis da máquina de estados conversacional.
 */
export type StepName =
  | 'CATEGORIA'
  | 'DESCRICAO'
  | 'ENDERECO'
  | 'COORDENADAS'
  | 'FOTOS'
  | 'CONFIRMACAO';

/**
 * Ordem sequencial dos passos na jornada do usuário.
 *
 * É utilizada pelo comando global `voltar` para saber qual é o passo anterior:
 * `STEP_ORDER[currentIndex - 1]`
 */
export const STEP_ORDER: StepName[] = [
  'CATEGORIA',
  'DESCRICAO',
  'ENDERECO',
  'COORDENADAS',
  'FOTOS',
  'CONFIRMACAO',
];

/**
 * Rascunho da denúncia acumulado durante a conversa com o usuário.
 * Cada passo preenche um ou mais campos deste objeto.
 */
export interface Draft {
  /** Categoria selecionada pelo usuário */
  category?: string;

  /** Descrição detalhada do problema */
  description?: string;

  /** Endereço digitado pelo usuário */
  address?: string;

  /** Latitude do pin de GPS */
  latitude?: number;

  /** Longitude do pin de GPS */
  longitude?: number;

  /** URLs das imagens enviadas ao armazenamento */
  photoUrls: string[];
}

/**
 * Objeto completo de sessão de um usuário ativo.
 */
export interface Session {
  /** UUID estável do rascunho; compõe a chave de idempotência do envio ao backend. */
  complaintId: string;
  /** Em qual etapa da conversa o usuário se encontra atualmente. */
  step: StepName;

  /** Dados parciais já coletados até o momento */
  draft: Draft;
}
