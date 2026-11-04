// src/conversation/session/session.store.ts
import { Session } from './session.types';

/**
 * Contrato (Interface) para persistência e recuperação de sessões de conversa.
 *
 * Permite trocar facilmente a estratégia de armazenamento (ex.: de memória local para Redis em cluster)
 * sem precisar alterar nenhuma linha da lógica do `ConversationService`.
 */
export interface SessionStore {
  /**
   * Busca a sessão ativa de um usuário pelo seu identificador (número de telefone).
   * @returns A sessão encontrada ou `null` se não existir ou tiver expirado.
   */
  get(id: string): Promise<Session | null>;

  /**
   * Salva ou atualiza os dados da sessão do usuário.
   */
  set(id: string, session: Session): Promise<void>;

  /**
   * Remove a sessão do usuário (ao cancelar ou ao finalizar com sucesso).
   */
  delete(id: string): Promise<void>;
}

/**
 * Token de Injeção de Dependência para o `SessionStore`.
 */
export const SESSION_STORE = Symbol('SESSION_STORE');
