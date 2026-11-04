/** Verifica inicialização segura dos modos de simulação e produção e validação da porta. */
import { validateConfig } from './config';
describe('configuração', () => {
  it('permite simulação sem serviços externos', () =>
    expect(
      validateConfig({ SIMULATION_MODE: 'true', WEBHOOK_TOKEN: 'test' }).PORT,
    ).toBe(3001));
  it('recusa simulação em produção', () =>
    expect(() =>
      validateConfig({
        NODE_ENV: 'production',
        SIMULATION_MODE: 'true',
        WEBHOOK_TOKEN: 'test',
      }),
    ).toThrow('Simulação'));
  it('exige configuração real', () =>
    expect(() => validateConfig({ WEBHOOK_TOKEN: 'test' })).toThrow(
      'REDIS_URL',
    ));
  it('recusa porta inválida', () =>
    expect(() =>
      validateConfig({
        SIMULATION_MODE: 'true',
        WEBHOOK_TOKEN: 'test',
        PORT: 'abc',
      }),
    ).toThrow('PORT'));
});
