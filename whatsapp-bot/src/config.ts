/**
 * Valida o ambiente na inicialização do ConfigModule e normaliza PORT.
 * Segredos não possuem valores reais padrão. A simulação é opt-in e proibida
 * em NODE_ENV=production. A tabela completa fica em docs/CONFIGURACAO.md.
 * @throws Error quando um valor obrigatório ou seu formato é inválido.
 */
export function validateConfig(env: Record<string, unknown>) {
  const config = { ...env };
  for (const name of ['SIMULATION_MODE', 'USE_FAKE_MESSENGER']) {
    if (
      config[name] !== undefined &&
      config[name] !== 'true' &&
      config[name] !== 'false'
    )
      throw new Error(`${name} deve ser true ou false`);
  }
  const simulation = config.SIMULATION_MODE === 'true';
  if (config.NODE_ENV === 'production' && simulation)
    throw new Error('Simulação proibida em produção');
  // A simulação também exige autenticação no webhook local.
  const required = ['WEBHOOK_TOKEN'];
  if (!simulation) {
    required.push(
      'REDIS_URL',
      'BACKEND_URL',
      'BOT_API_KEY',
      'EVOLUTION_URL',
      'EVOLUTION_INSTANCE',
      'EVOLUTION_APIKEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_BUCKET',
    );
    if (config.USE_FAKE_MESSENGER === 'true')
      throw new Error('Mensageiro falso exige SIMULATION_MODE=true');
  }
  for (const name of required) {
    const value = config[name];
    if (typeof value !== 'string' || !value.trim())
      throw new Error(`Variável obrigatória ausente: ${name}`);
  }
  // Validar o protocolo evita tratar caminhos locais como URLs de serviços.
  for (const name of ['BACKEND_URL', 'EVOLUTION_URL', 'SUPABASE_URL']) {
    const value = config[name];
    if (
      value &&
      (typeof value !== 'string' ||
        !['http:', 'https:'].includes(new URL(value).protocol))
    )
      throw new Error(`${name} deve usar HTTP ou HTTPS`);
  }
  if (
    config.REDIS_URL &&
    (typeof config.REDIS_URL !== 'string' ||
      !['redis:', 'rediss:'].includes(new URL(config.REDIS_URL).protocol))
  )
    throw new Error('REDIS_URL inválida');
  const port = Number(config.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT inválida');
  return { ...config, PORT: port };
}
