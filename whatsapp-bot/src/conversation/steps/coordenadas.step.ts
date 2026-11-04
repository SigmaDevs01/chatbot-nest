// src/conversation/steps/coordenadas.step.ts
import { messages } from '../messages';
import { normalize } from '../text.util';
import { Step } from './step.interface';

/**
 * Passo 4: Coordenadas Geográficas (GPS via WhatsApp).
 *
 * Regras:
 * - Opcional: o usuário pode anexar a localização nativa pelo WhatsApp (📎 > Localização).
 * - Se enviar a localização: armazena latitude e longitude no draft e avança para 'FOTOS'.
 * - Se digitar "pular": zera latitude/longitude e avança para 'FOTOS'.
 * - Se enviar qualquer outro texto: orienta a enviar a localização ou digitar "pular".
 */
export const coordenadasStep: Step = {
  prompt: () => messages.coordenadas(),

  handle(msg, session) {
    // Se a mensagem contiver o objeto de localização nativo do WhatsApp
    if (msg.location) {
      session.draft.latitude = msg.location.lat;
      session.draft.longitude = msg.location.lng;
      return { type: 'next', next: 'FOTOS' };
    }

    // Se o usuário preferir pular esta etapa
    if (normalize(msg.text ?? '') === 'pular') {
      session.draft.latitude = undefined;
      session.draft.longitude = undefined;
      return { type: 'next', next: 'FOTOS' };
    }

    return {
      type: 'stay',
      message: 'Envie a localização pelo 📎 ou digite *pular*.',
    };
  },
};
