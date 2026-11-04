// src/webhook/dto/incoming-message.ts

/**
 * DTO que padroniza o formato interno de qualquer mensagem recebida pelo Bot.
 *
 * Isola o restante da aplicação dos detalhes complexos e específicos do JSON bruto
 * retornado pela Evolution API.
 */
export interface IncomingMessage {
  /** Identificador único da mensagem no WhatsApp (usado para deduplicação/idempotência) */
  id: string;

  /** Número de telefone do remetente sem sufixos (ex.: "5511999999999") */
  from: string;

  /** Conteúdo em texto enviado pelo usuário (se houver) */
  text?: string;

  /** Coordenadas geográficas (latitude e longitude) se o usuário enviou um pin de localização */
  location?: {
    lat: number;
    lng: number;
  };

  /** Indica se a mensagem contém anexos de mídia (imagem, vídeo ou documento) */
  hasMedia: boolean;
  /** Somente imagens recebem esse marcador; outras mídias continuam com hasMedia=true. */
  mediaType?: 'image';
  /** MIME declarado pela imagem; o conteúdo binário ainda precisa ser validado. */
  mimetype?: string;
  /** Preenchido internamente apenas depois de um upload bem-sucedido (ou simulado). */
  photoUrl?: string;

  /** Corpo bruto preservado como unknown; o download atual utiliza id e from */
  raw: unknown;
}
