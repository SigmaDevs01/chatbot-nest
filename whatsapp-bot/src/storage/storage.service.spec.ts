/** Valida rejeição de assinatura incompatível e caminho determinístico. O SDK Supabase é substituído por um dublê. */
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { StorageService } from './storage.service';
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
describe('StorageService', () => {
  const upload = jest.fn().mockResolvedValue({ error: null });
  const getPublicUrl = jest.fn().mockReturnValue({
    data: { publicUrl: 'https://storage.example/photo.jpg' },
  });
  const from = jest.fn().mockReturnValue({ upload, getPublicUrl });
  const config = new ConfigService({
    SUPABASE_URL: 'https://supabase.example',
    SUPABASE_SERVICE_ROLE_KEY: 'secret',
    SUPABASE_BUCKET: 'photos',
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(createClient)
      .mockReturnValue({ storage: { from } } as unknown as ReturnType<
        typeof createClient
      >);
  });
  it('não exige cliente Supabase na construção', () => {
    new StorageService(new ConfigService());
    expect(createClient).not.toHaveBeenCalled();
  });
  it('recusa arquivo com MIME de imagem e assinatura incompatível', async () => {
    await expect(
      new StorageService(config).uploadPhoto(
        Buffer.from('arquivo qualquer'),
        'image/jpeg',
        'message',
      ),
    ).rejects.toThrow('Formato');
    expect(upload).not.toHaveBeenCalled();
  });
  it('salva imagem e reutiliza caminho sem telefone em repetição', async () => {
    const service = new StorageService(config),
      image = Buffer.from([255, 216, 255, 224, 0]);
    expect(
      await service.uploadPhoto(image, 'image/jpeg', '5511999999999:abc'),
    ).toBe('https://storage.example/photo.jpg');
    await service.uploadPhoto(image, 'image/jpeg', '5511999999999:abc');
    expect(upload.mock.calls[0]).toEqual(upload.mock.calls[1]);
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^whatsapp\/[a-f0-9]{64}\.jpg$/),
      image,
      { contentType: 'image/jpeg', upsert: true },
    );
  });
});
