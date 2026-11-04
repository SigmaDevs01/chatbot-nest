/** Contrato do cliente HTTP: protocolo válido, cabeçalho de idempotência e erros de validação. O transporte é simulado. */
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { BackendClient } from './backend.client';
const payload = {
  category: 'Entulho',
  description: 'Descrição teste',
  address: 'Rua A, 10',
  photos: [],
  origem: 'whatsapp' as const,
  telefone: '5511999999999',
};
describe('BackendClient', () => {
  const post = jest.fn();
  const client = new BackendClient(
    { post } as unknown as HttpService,
    new ConfigService({
      BACKEND_URL: 'https://backend.example/',
      BOT_API_KEY: 'secret',
    }),
  );
  beforeEach(() => post.mockReset());
  it('envia chave de idempotência e retorna protocolo real', async () => {
    post.mockReturnValue(of({ data: { id: 'DEN-42' } }));
    expect(await client.createComplaint(payload, 'unique-key')).toEqual({
      id: 'DEN-42',
    });
    expect(post).toHaveBeenCalledWith(
      'https://backend.example/bot/complaints',
      payload,
      expect.objectContaining({
        timeout: 15000,
        headers: { 'Idempotency-Key': 'unique-key', 'x-bot-key': 'secret' },
      }),
    );
  });
  it('recusa resposta sem protocolo', async () => {
    post.mockReturnValue(of({ data: {} }));
    await expect(client.createComplaint(payload, 'key')).rejects.toThrow(
      'protocolo',
    );
  });
  it('preserva status e erros de validação', async () => {
    post.mockReturnValue(
      throwError(() => ({
        isAxiosError: true,
        response: { status: 400, data: { message: ['campo inválido'] } },
      })),
    );
    await expect(client.createComplaint(payload, 'key')).rejects.toMatchObject({
      status: 400,
      details: 'campo inválido',
    });
  });
});
