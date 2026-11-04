import { Injectable } from '@nestjs/common';

/** Serviço demonstrativo do scaffold, mantido para o teste legado de Hello World. */
@Injectable()
export class AppService {
  /** Retorna a mensagem fixa do exemplo; não participa do fluxo de denúncias. */
  getHello(): string {
    return 'Hello World!';
  }
}
