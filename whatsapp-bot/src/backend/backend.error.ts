// src/backend/backend.error.ts

/**
 * Erro customizado disparado quando a chamada à API de denúncias falha.
 *
 * Permite capturar o código HTTP da resposta (ex.: 400 Bad Request, 500 Internal Error)
 * e a mensagem de validação retornada pela API para repassar amigavelmente ao usuário no WhatsApp.
 */
export class BackendError extends Error {
  constructor(
    /** Código de status HTTP retornado pela API do backend (se houver) */
    public readonly status: number | undefined,
    /** Detalhes ou mensagens de erro retornadas pelo backend */
    public readonly details: string,
  ) {
    super(details);
    this.name = 'BackendError';
  }
}
