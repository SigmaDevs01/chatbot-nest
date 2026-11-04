/** Integração HTTP real do NestJS com transporte WhatsApp, backend e fotos simulados. Cobre fluxo e recuperação de falhas sem chamadas externas. */
import type { App } from 'supertest/types';
import type { CreateComplaintPayload } from '../src/backend/dto/create-complaint.payload';
import type { IncomingMessage } from '../src/webhook/dto/incoming-message';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MESSENGER } from '../src/messaging/messenger';
import { BackendClient } from '../src/backend/backend.client';
import { BackendError } from '../src/backend/backend.error';
import { PhotoService } from '../src/storage/photo.service';

describe('Webhook e fluxo de denúncias', () => {
  let app: INestApplication<App>;
  const sender = '5511999999999';
  let sequence = 0;
  const messenger = { sendText: jest.fn().mockResolvedValue(undefined) };
  const backend = {
    createComplaint: jest.fn<
      Promise<{ id: string }>,
      [CreateComplaintPayload, string]
    >(),
  };
  const photos = { upload: jest.fn<Promise<string>, [IncomingMessage]>() };
  let received: string[];
  function post(message: object, id = `test-${++sequence}`, phone = sender) {
    return request(app.getHttpServer())
      .post('/webhook')
      .set('x-webhook-token', 'test-secret')
      .send({
        event: 'messages.upsert',
        data: {
          key: { id, remoteJid: `${phone}@s.whatsapp.net`, fromMe: false },
          message,
        },
      });
  }
  async function text(value: string, id?: string) {
    await post({ conversation: value }, id).expect(200);
    return received.at(-1)!;
  }
  async function toPhotos() {
    await text('oi');
    await text('1');
    await text('Um buraco grande na rua');
    await text('Rua das Flores, 10, Centro');
    await text('pular');
  }
  beforeAll(async () => {
    process.env.SIMULATION_MODE = 'true';
    process.env.WEBHOOK_TOKEN = 'test-secret';
    delete process.env.REDIS_URL;
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MESSENGER)
      .useValue(messenger)
      .overrideProvider(BackendClient)
      .useValue(backend)
      .overrideProvider(PhotoService)
      .useValue(photos)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    received = [];
    messenger.sendText
      .mockReset()
      .mockImplementation((_phone: string, reply: string) => {
        received.push(reply);
        return Promise.resolve();
      });
    backend.createComplaint.mockReset().mockResolvedValue({ id: 'DEN-42' });
    photos.upload
      .mockReset()
      .mockResolvedValue('https://storage.example/photo.jpg');
    await text('cancelar');
    await text('cancelar');
    received = [];
  });
  it('exige token', async () => {
    await request(app.getHttpServer()).post('/webhook').send({}).expect(401);
  });
  it('ignora payload incompleto sem lançar erro', async () => {
    await request(app.getHttpServer())
      .post('/webhook')
      .set('x-webhook-token', 'test-secret')
      .send({ event: 'messages.upsert', data: { key: { remoteJid: 123 } } })
      .expect(200, { ignored: true });
  });
  it('percorre todas as etapas e envia URLs ao backend', async () => {
    await toPhotos();
    await post({ videoMessage: {} }).expect(200);
    expect(received.at(-1)).toContain('vídeos e documentos não são aceitos');
    await post({ imageMessage: { mimetype: 'image/jpeg' } }).expect(200);
    await text('pronto');
    expect(received.at(-1)).toContain('Fotos: 1');
    expect(await text('sim')).toContain('Nenhuma denúncia foi registrada');
    expect(backend.createComplaint).toHaveBeenCalledTimes(1);
    expect(backend.createComplaint).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Buraco na via / rua',
        photos: ['https://storage.example/photo.jpg'],
        telefone: sender,
      }),
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });
  it('retorna protocolo real somente após sucesso e não reenvia denúncia ao repetir resposta', async () => {
    await toPhotos();
    await text('pular');
    const config = app.get(ConfigService);
    config.set('SIMULATION_MODE', 'false');
    try {
      messenger.sendText.mockRejectedValueOnce(new Error('send timeout'));
      await post({ conversation: 'sim' }, 'final-send-failure').expect(500);
      await post({ conversation: 'sim' }, 'final-send-failure').expect(200);
      expect(received.at(-1)).toContain(
        'Denúncia registrada! Protocolo: DEN-42',
      );
      expect(backend.createComplaint).toHaveBeenCalledTimes(1);
    } finally {
      config.set('SIMULATION_MODE', 'true');
    }
  });
  it('cancelar funciona sem sessão e permite reiniciar', async () => {
    expect(await text('cancelar')).toContain('cancelada');
    expect(await text('oi')).toContain('Qual o tipo');
  });
  it('não processa duas vezes o mesmo webhook', async () => {
    await text('oi', 'duplicate');
    const count = received.length;
    await post({ conversation: 'oi' }, 'duplicate').expect(200, {
      duplicate: true,
    });
    expect(received).toHaveLength(count);
  });
  it('repete resposta após falha de envio sem repetir etapa', async () => {
    await text('oi');
    messenger.sendText.mockRejectedValueOnce(new Error('Evolution fora'));
    await post({ conversation: '1' }, 'send-failure').expect(500);
    await post({ conversation: '1' }, 'send-failure').expect(200);
    expect(received.at(-1)).toContain('Descreva o problema');
    expect(await text('Descrição válida de teste')).toContain('endereço');
  });
  it('preserva rascunho e chave em uma nova tentativa de envio', async () => {
    await toPhotos();
    await text('pular');
    backend.createComplaint.mockRejectedValueOnce(
      new BackendError(503, 'indisponível'),
    );
    expect(await text('sim')).toContain('tentar de novo');
    expect(await text('sim')).toContain('Simulação concluída');
    expect(backend.createComplaint.mock.calls[0][1]).toBe(
      backend.createComplaint.mock.calls[1][1],
    );
  });
  it('permite corrigir dados recusados e voltar uma etapa', async () => {
    await text('oi');
    await text('1');
    expect(await text('voltar')).toContain('Qual o tipo');
    await text('2');
    await text('Descrição válida de teste');
    await text('Rua de teste, 123');
    await text('pular');
    await text('pular');
    backend.createComplaint.mockRejectedValueOnce(
      new BackendError(400, 'Endereço inválido'),
    );
    expect(await text('sim')).toContain('Endereço inválido');
    expect(await text('voltar')).toContain('Envie até 5');
  });
  it('falha no upload não contabiliza foto', async () => {
    await toPhotos();
    photos.upload.mockRejectedValueOnce(new Error('storage fora'));
    await post({ imageMessage: { mimetype: 'image/jpeg' } }).expect(200);
    expect(received.at(-1)).toContain('Não consegui salvar');
    await text('pronto');
    expect(received.at(-1)).toContain('Fotos: 0');
  });
  it('limita fotos a cinco', async () => {
    await toPhotos();
    photos.upload.mockImplementation((msg: { id: string }) =>
      Promise.resolve(`https://storage.example/${msg.id}.jpg`),
    );
    for (let i = 0; i < 6; i++) await post({ imageMessage: {} }).expect(200);
    expect(photos.upload).toHaveBeenCalledTimes(5);
    expect(received.at(-1)).toContain('Limite de 5');
  });
  it('serializa mensagens simultâneas do mesmo usuário', async () => {
    await text('oi');
    await Promise.all([
      post({ conversation: '1' }).then((r) => expect(r.status).toBe(200)),
      post({ conversation: 'Descrição em sequência' }).then((r) =>
        expect(r.status).toBe(200),
      ),
    ]);
    expect(received.at(-1)).toContain('endereço');
  });
});
