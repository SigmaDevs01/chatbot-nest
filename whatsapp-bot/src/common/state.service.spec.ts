/** Verifica TTL, isolamento, rollback das alterações pendentes em memória e concorrência local. Não exercita um servidor Redis real. */
import { ConfigService } from '@nestjs/config';
import { StateService } from './state.service';
import { IdempotencyService } from './idempotency.service';
describe('persistência e idempotência', () => {
  let state: StateService;
  beforeEach(async () => {
    state = new StateService(new ConfigService({ SIMULATION_MODE: 'true' }));
    await state.onModuleInit();
  });
  afterEach(async () => {
    await state.onModuleDestroy();
    jest.restoreAllMocks();
  });
  it('expira e isola valores', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    const draft = { photos: ['a'] };
    await state.set('key', draft, 1000);
    draft.photos.push('b');
    expect(await state.get('key')).toEqual({ photos: ['a'] });
    clock.mockReturnValue(now + 1001);
    expect(await state.get('key')).toBeNull();
  });
  it('permite retry se o processamento falhar', async () => {
    const service = new IdempotencyService(state),
      process = jest
        .fn()
        .mockRejectedValueOnce(new Error('erro'))
        .mockResolvedValue('ok'),
      send = jest.fn().mockResolvedValue(undefined);
    await expect(service.deliver('user', 'id', process, send)).rejects.toThrow(
      'erro',
    );
    await service.deliver('user', 'id', process, send);
    expect(process).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledWith('ok');
  });
  it('não grava sessão parcial quando a transação falha', async () => {
    await expect(
      state.transaction(async () => {
        await state.set('session', { step: 'FOTOS' }, 1000);
        throw new Error('abort');
      }),
    ).rejects.toThrow('abort');
    expect(await state.get('session')).toBeNull();
  });
  it('deduplica chamadas concorrentes', async () => {
    const service = new IdempotencyService(state),
      process = jest.fn().mockResolvedValue('ok'),
      send = jest.fn().mockResolvedValue(undefined);
    await Promise.all([
      service.deliver('u', 'i', process, send),
      service.deliver('u', 'i', process, send),
    ]);
    expect(process).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
