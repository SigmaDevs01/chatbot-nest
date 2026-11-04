import { IncomingMessage } from './dto/incoming-message';

/** Permite inspecionar JSON desconhecido sem assumir objetos, arrays ou strings. */
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Converte um messages.upsert da Evolution API em mensagem interna ou null quando ignorado.
 * Suporta formatos da Evolution v1 e v2 (lowercase ou UPPERCASE nos eventos),
 * aceita data como objeto único ou array de mensagens,
 * e desembrulha mensagens de texto, visualização única, efêmeras ou fotos com legenda.
 */
export function parseWebhook(body: unknown): IncomingMessage | null {
  const payload = record(body);
  const event = typeof payload.event === 'string' ? payload.event.toLowerCase() : '';
  if (event !== 'messages.upsert' && event !== 'messages_upsert') return null;

  let rawData = payload.data;
  if (Array.isArray(rawData) && rawData.length > 0) {
    rawData = rawData[0];
  }
  const data = record(rawData);

  // Pode estar diretamente em data ou dentro de data.messages[0]
  let item = data;
  if (Array.isArray(data.messages) && data.messages.length > 0) {
    item = record(data.messages[0]);
  }

  const key = record(item.key || data.key);
  if (
    key.fromMe !== false ||
    typeof key.id !== 'string' ||
    !key.id.trim() ||
    key.id.length > 200
  )
    return null;

  if (
    typeof key.remoteJid !== 'string' ||
    !/^\d{8,15}@(s\.whatsapp\.net|c\.us)$/.test(key.remoteJid)
  )
    return null;

  // Desembrulha uma camada dos formatos efêmero/visualização única conhecidos.
  let m = record(item.message || data.message);
  m = record(
    record(m.ephemeralMessage).message ??
      record(m.viewOnceMessage).message ??
      m,
  );

  const text =
    m.conversation ??
    record(m.extendedTextMessage).text ??
    record(m.imageMessage).caption;

  if (text !== undefined && (typeof text !== 'string' || text.length > 4096))
    return null;

  const loc = record(m.locationMessage),
    lat = loc.degreesLatitude,
    lng = loc.degreesLongitude;

  // Evita NaN, infinito e coordenadas fora das faixas geográficas.
  const validLocation =
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180;

  // Ter mídia não significa ser foto: a etapa FOTOS diferencia os formatos.
  const image = record(m.imageMessage),
    hasImage = !!m.imageMessage;

  const fromNumber = key.remoteJid.replace(/@.*$/, '');

  return {
    id: key.id,
    from: fromNumber,
    text: typeof text === 'string' ? text : undefined,
    location: validLocation ? { lat, lng } : undefined,
    hasMedia: !!(
      hasImage ||
      m.videoMessage ||
      m.documentMessage ||
      m.audioMessage ||
      m.stickerMessage
    ),
    mediaType: hasImage ? 'image' : undefined,
    mimetype: typeof image.mimetype === 'string' ? image.mimetype : undefined,
    raw: data,
  };
}
