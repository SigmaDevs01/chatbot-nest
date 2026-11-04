// src/backend/dto/create-complaint.payload.ts

/**
 * Payload consolidado enviado para a API de denúncias ao finalizar o fluxo do bot.
 *
 * Contém todos os dados coletados ao longo dos passos conversacionais.
 */
export interface CreateComplaintPayload {
  /** Categoria da infraestrutura urbana (ex.: "Buraco na via / rua") */
  category: string;

  /** Detalhamento do problema relatado pelo cidadão */
  description: string;

  /** Endereço textual informado (rua, número, bairro) */
  address: string;

  /** Latitude decimal da localização enviada pelo WhatsApp (opcional) */
  latitude?: number;

  /** Longitude decimal da localização enviada pelo WhatsApp (opcional) */
  longitude?: number;

  /** Lista de URLs públicas das fotos enviadas para o Supabase Storage */
  photos: string[];

  /** Origem fixa da abertura do chamado */
  origem: 'whatsapp';

  /** Número de telefone do cidadão remetente */
  telefone: string;
}
