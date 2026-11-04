import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { StateService } from '../../common/state.service';
import { Session } from './session.types';
import { SessionStore } from './session.store';
/** Adapta o contrato de sessões ao StateService e define expiração de 30 minutos. */
@Injectable()
export class PersistentSessionStore implements SessionStore {
  constructor(
    private readonly state: StateService,
    private readonly config: ConfigService,
  ) {}
  /** Isola conversas de instâncias Evolution diferentes que compartilham Redis. */
  private key(id: string) {
    return `session:${this.config.get<string>('EVOLUTION_INSTANCE') ?? 'simulation'}:${id}`;
  }
  /** Retorna null quando não há sessão ou quando seu TTL expirou. */
  get(id: string) {
    return this.state.get<Session>(this.key(id));
  }
  /** Cada gravação renova o prazo de inatividade; participa da transação corrente. */
  set(id: string, session: Session) {
    return this.state.set(this.key(id), session, 30 * 60 * 1000);
  }
  /** Encerra o rascunho sem remover o histórico de entregas do webhook. */
  delete(id: string) {
    return this.state.delete(this.key(id));
  }
}
