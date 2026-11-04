/** Exercita payloads malformados, filtros de remetente, texto, localização e classificação de mídia. */
import { parseWebhook } from './webhook.parser';
function body(message: unknown, key: object = {}) {
  return {
    event: 'messages.upsert',
    data: {
      key: {
        id: 'abc',
        fromMe: false,
        remoteJid: '5511999999999@s.whatsapp.net',
        ...key,
      },
      message,
    },
  };
}
describe('parseWebhook', () => {
  it('extrai texto estendido', () =>
    expect(
      parseWebhook(body({ extendedTextMessage: { text: 'oi' } }))?.text,
    ).toBe('oi'));
  it.each([
    null,
    {},
    { event: 'other' },
    body({}, { id: undefined }),
    body({}, { remoteJid: 123 }),
    body({}, { fromMe: true }),
    body({}, { remoteJid: 'group@g.us' }),
    body({ conversation: {} }),
  ])('ignora entrada inválida %#', (input) =>
    expect(parseWebhook(input)).toBeNull(),
  );
  it('valida faixa de coordenadas', () => {
    expect(
      parseWebhook(
        body({
          locationMessage: { degreesLatitude: 200, degreesLongitude: 0 },
        }),
      )?.location,
    ).toBeUndefined();
    expect(
      parseWebhook(
        body({
          locationMessage: { degreesLatitude: -23.5, degreesLongitude: -46.6 },
        }),
      )?.location,
    ).toEqual({ lat: -23.5, lng: -46.6 });
  });
  it('distingue imagem e documento', () => {
    expect(
      parseWebhook(body({ imageMessage: { mimetype: 'image/png' } }))
        ?.mediaType,
    ).toBe('image');
    expect(
      parseWebhook(body({ documentMessage: {} }))?.mediaType,
    ).toBeUndefined();
  });
});
