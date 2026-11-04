import { AsyncLocalStorage } from 'async_hooks';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { randomUUID } from 'crypto';
import { setTimeout as delay } from 'timers/promises';

/**
 * Persistência compartilhada e coordenação das conversas.
 * No modo real, usa uma conexão Redis; na simulação sem REDIS_URL, usa memória.
 * AsyncLocalStorage mantém as alterações pendentes e o dono do bloqueio separados
 * entre requisições concorrentes. O contexto existe apenas durante a operação.
 * Veja docs/ARQUITETURA.md para a ordem entre persistência e efeitos externos.
 */
@Injectable()
export class StateService implements OnModuleInit, OnModuleDestroy {
  /** Contexto por execução assíncrona: bloqueio adquirido e operações pendentes. */
  private context = new AsyncLocalStorage<{
    lock?: { key: string; token: string };
    changes?: Map<string, { value: string | null; ttlMs: number }>;
  }>();
  private client?: ReturnType<typeof createClient>;
  /** JSON serializado evita compartilhar referências mutáveis entre sessões. */
  private memory = new Map<string, { value: string; expires: number }>();
  /** Fila local por chave; o bloqueio Redis acrescenta exclusão entre réplicas. */
  private queues = new Map<string, Promise<void>>();
  private cleanup?: ReturnType<typeof setInterval>;
  private readonly logger = new Logger(StateService.name);
  constructor(private readonly config: ConfigService) {}
  /**
   * Conecta antes de aceitar tráfego. Falha de Redis não vira fallback em memória.
   * A conexão não reconecta automaticamente: recuperar o serviço requer reinício.
   */
  async onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (url) {
      this.client = createClient({
        url,
        disableOfflineQueue: true,
        socket: { connectTimeout: 5000, reconnectStrategy: false },
      });
      this.client.on('error', () => this.logger.error('Redis indisponível'));
      await this.client.connect();
    } else {
      if (this.config.get('SIMULATION_MODE') !== 'true')
        throw new Error('REDIS_URL obrigatória');
      this.cleanup = setInterval(() => this.sweep(), 60000);
      this.cleanup.unref();
    }
  }
  /** Libera conexão e timer durante o encerramento do NestJS. */
  async onModuleDestroy() {
    if (this.cleanup) clearInterval(this.cleanup);
    if (this.client?.isOpen) await this.client.close();
  }
  /** Namespace versionado para separar os dados do bot no banco Redis. */
  private key(key: string) {
    return `chatbot:v1:${key}`;
  }
  /** Remove também sessões de usuários que nunca voltaram após a expiração. */
  private sweep() {
    for (const [key, entry] of this.memory)
      if (entry.expires <= Date.now()) this.memory.delete(key);
  }
  /**
   * Prioriza a escrita pendente da transação, depois consulta a persistência.
   * O parâmetro T orienta o TypeScript; não valida o formato do JSON em runtime.
   */
  async get<T>(key: string): Promise<T | null> {
    const staged = this.context.getStore()?.changes?.get(key);
    if (staged)
      return staged.value === null ? null : (JSON.parse(staged.value) as T);
    if (this.client) {
      const value = await this.client.get(this.key(key));
      return value === null ? null : (JSON.parse(value) as T);
    }
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expires <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }
  /** Salva ou prepara JSON com TTL em milissegundos; limita a memória da simulação. */
  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    const encoded = JSON.stringify(value);
    const changes = this.context.getStore()?.changes;
    if (changes) {
      changes.set(key, { value: encoded, ttlMs });
      return;
    }
    if (this.client) {
      await this.client.set(this.key(key), encoded, { PX: ttlMs });
      return;
    }
    this.sweep();
    if (!this.memory.has(key) && this.memory.size >= 10000)
      throw new ServiceUnavailableException('Limite da simulação');
    this.memory.set(key, { value: encoded, expires: Date.now() + ttlMs });
  }
  /** null no lote representa remoção; fora de uma transação, remove imediatamente. */
  async delete(key: string): Promise<void> {
    const changes = this.context.getStore()?.changes;
    if (changes) {
      changes.set(key, { value: null, ttlMs: 0 });
      return;
    }
    if (this.client) {
      await this.client.del(this.key(key));
      return;
    }
    this.memory.delete(key);
  }

  /**
   * Agrupa alterações da sessão e da resposta antes do envio ao WhatsApp.
   * A função executada lê suas próprias alterações pendentes; se lançar erro,
   * elas não são aplicadas. No Redis, o script verifica o dono do bloqueio e
   * aplica o lote sem intercalação com outros comandos.
   *
   * Use dentro de withLock no fluxo de webhook. Transações aninhadas não são
   * suportadas. Chamadas HTTP e uploads feitos pela função não são revertidos.
   * Erros de execução do Redis não oferecem rollback ACID dos comandos Lua.
   */
  async transaction<T>(action: () => Promise<T>): Promise<T> {
    const changes = new Map<string, { value: string | null; ttlMs: number }>();
    const lock = this.context.getStore()?.lock;
    const result = await this.context.run({ lock, changes }, action);
    if (this.client) {
      // KEYS[1] identifica o bloqueio; as demais chaves seguem a ordem das operações.
      // ARGV[1] contém o token do dono e ARGV[2] o lote JSON [valor, ttlMs].
      // O uso de múltiplas chaves pressupõe Redis único, não Redis Cluster.
      const keys = [
        lock?.key ?? this.key('transaction'),
        ...[...changes.keys()].map((key) => this.key(key)),
      ];
      const operations = [...changes.values()].map((entry) => [
        entry.value,
        entry.ttlMs,
      ]);
      await this.client.eval(
        `
    if ARGV[1] ~= '' and redis.call('get',KEYS[1]) ~= ARGV[1] then return redis.error_reply('LOCK_LOST') end
    local ops = cjson.decode(ARGV[2])
    for i, op in ipairs(ops) do
     if op[1] == cjson.null then redis.call('del',KEYS[i+1])
     else redis.call('set',KEYS[i+1],op[1],'PX',op[2]) end
    end
    return 1`,
        { keys, arguments: [lock?.token ?? '', JSON.stringify(operations)] },
      );
    } else {
      this.sweep();
      // Verifica a capacidade antes de modificar a memória para não aplicar só parte do lote.
      let count = this.memory.size;
      for (const [key, entry] of changes) {
        if (entry.value === null && this.memory.has(key)) count--;
        if (entry.value !== null && !this.memory.has(key)) count++;
      }
      if (count > 10000)
        throw new ServiceUnavailableException('Limite da simulação');
      for (const [key, entry] of changes) {
        if (entry.value === null) this.memory.delete(key);
        else
          this.memory.set(key, {
            value: entry.value,
            expires: Date.now() + entry.ttlMs,
          });
      }
    }
    return result;
  }

  /**
   * Serializa chamadas locais e adquire o bloqueio distribuído quando há Redis.
   * A rejeição é absorvida apenas na cauda da fila; o chamador ainda recebe o erro.
   */
  async withLock<T>(key: string, action: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(key) ?? Promise.resolve();
    const run = previous.then(() => this.distributedLock(key, action));
    const tail = run.then(
      () => undefined,
      () => undefined,
    );
    this.queues.set(key, tail);
    void tail.then(() => {
      if (this.queues.get(key) === tail) this.queues.delete(key);
    });
    return run;
  }
  /**
   * Tenta adquirir por até 5 s, com lease de 120 s renovado a cada 30 s.
   * Um token aleatório impede que uma execução antiga libere o bloqueio de outra.
   * A expiração protege contra processos mortos; não torna efeitos HTTP atômicos.
   */
  private async distributedLock<T>(
    key: string,
    action: () => Promise<T>,
  ): Promise<T> {
    const client = this.client;
    if (!client) return action();
    const lockKey = this.key(`lock:${key}`),
      token = randomUUID(),
      deadline = Date.now() + 5000;
    while (
      (await client.set(lockKey, token, { NX: true, PX: 120000 })) !== 'OK'
    ) {
      if (Date.now() >= deadline)
        throw new ServiceUnavailableException(
          'Conversa ocupada; reenvie o webhook',
        );
      await delay(100);
    }
    // Se a renovação falhar, não devolvemos sucesso silencioso ao webhook.
    let lost = false;
    const renewal = setInterval(() => {
      void client
        .eval(
          "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('pexpire',KEYS[1],120000) else return 0 end",
          { keys: [lockKey], arguments: [token] },
        )
        .then(
          (v) => {
            if (v !== 1) lost = true;
          },
          () => {
            lost = true;
          },
        );
    }, 30000);
    renewal.unref();
    try {
      const result = await this.context.run(
        { lock: { key: lockKey, token } },
        action,
      );
      if (lost) throw new ServiceUnavailableException('Bloqueio perdido');
      return result;
    } finally {
      // Libera mesmo após falha, mas somente se o token ainda for o dono.
      clearInterval(renewal);
      await client.eval(
        "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",
        { keys: [lockKey], arguments: [token] },
      );
    }
  }
}
