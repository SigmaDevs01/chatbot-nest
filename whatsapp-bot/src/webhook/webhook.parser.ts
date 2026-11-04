import { IncomingMessage } from './dto/incoming-message';
/** Permite inspecionar JSON desconhecido sem assumir objetos, arrays ou strings. */
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
/**
 * Converte um único messages.upsert em mensagem interna ou null quando ignorado.
 * Aceita apenas JIDs numéricos diretos; grupos, status e @lid ficam fora do contrato.
 * Localização inválida é descartada; texto excessivo ou chave inválida descarta o evento.
 * Mantém o corpo bruto como unknown, sem confiar nele nem registrá-lo em logs.
 */
export function parseWebhook(body: unknown): IncomingMessage | null {
  const payload = record(body);
  if (payload.event !== 'messages.upsert') return null;
  const data = record(payload.data),
    key = record(data.key);
  if (
    key.fromMe !== false ||
    typeof key.id !== 'string' ||
    !key.id.trim() ||
    key.id.length > 200
  )
    return null;
  if (
    typeof key.remoteJid !== 'string' ||
    !/^\d{8,15}@s\.whatsapp\.net$/.test(key.remoteJid)
  )
    return null;
  // Desembrulha uma camada dos formatos efêmero/visualização única conhecidos.
  let m = record(data.message);
  m = record(
    record(m.ephemeralMessage).message ??
      record(m.viewOnceMessage).message ??
      m,
  );
  const text = m.conversation ?? record(m.extendedTextMessage).text;
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
  return {
    id: key.id,
    from: key.remoteJid.split('@')[0],
    text,
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
