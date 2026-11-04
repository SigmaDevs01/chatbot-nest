// src/conversation/steps/fotos.step.ts
import { messages } from '../messages';
import { normalize } from '../text.util';
import { Step } from './step.interface';

/** Limite máximo de fotos aceitas por denúncia */
const MAX_PHOTOS = 5;

/**
 * Passo 5: Envio de Fotos (Evidências Visuais).
 *
 * Regras:
 * - Opcional: o usuário pode enviar até 5 fotos, cada uma recebida em seu próprio evento.
 * - Cada imagem validada tem a URL do upload registrada em `photoUrls`.
 * - O usuário pode digitar "pronto" a qualquer momento para concluir a inclusão de fotos.
 * - O usuário pode digitar "pular" caso não queira anexar nenhuma foto.
 * - Ao atingir o limite de 5 fotos, o bot avisa que o limite foi alcançado e solicita que digite "pronto".
 */
export const fotosStep: Step = {
  prompt: () => messages.fotos(),

  handle(msg, session) {
    const photos = session.draft.photoUrls;

    // Outras mídias não podem ocupar uma posição no limite de fotos.
    if (msg.hasMedia && msg.mediaType !== 'image')
      return {
        type: 'stay',
        message:
          'Envie uma imagem JPEG, PNG ou WebP; vídeos e documentos não são aceitos.',
      };
    if (msg.mediaType === 'image') {
      if (photos.length >= MAX_PHOTOS) {
        return {
          type: 'stay',
          message: `Limite de ${MAX_PHOTOS} fotos. Digite *pronto* para continuar.`,
        };
      }

      if (!msg.photoUrl)
        return {
          type: 'stay',
          message:
            'Não consegui salvar a foto. Envie novamente uma imagem de até 5 MB.',
        };
      if (!photos.includes(msg.photoUrl)) photos.push(msg.photoUrl);
      return {
        type: 'stay',
        message: `📷 Foto ${photos.length} recebida. Envie outra ou digite *pronto*.`,
      };
    }

    // pronto e pular avançam sem apagar fotos já adicionadas.
    const text = normalize(msg.text ?? '');
    if (text === 'pronto' || text === 'pular') {
      return { type: 'next', next: 'CONFIRMACAO' };
    }

    return {
      type: 'stay',
      message: 'Envie uma foto, ou digite *pronto* / *pular*.',
    };
  },
};
