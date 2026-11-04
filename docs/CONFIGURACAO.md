# Instalação e configuração

## Instalação local

Requer Node.js 22 ou superior com npm. Docker é opcional para a simulação; o compose disponibiliza Redis local para persistência. Execute os comandos a partir da raiz `chatbot-nest`.

```powershell
npm ci
if (-not (Test-Path whatsapp-bot/.env)) {
    Copy-Item whatsapp-bot/.env.example whatsapp-bot/.env
}
npm run start:dev
```

O repositório usa npm workspaces. O `package-lock.json` válido fica na raiz; as dependências da aplicação estão declaradas em `whatsapp-bot/package.json`. O workspace se chama `whatsapp`. Comandos delegados pela raiz executam com o diretório de trabalho da aplicação, onde fica o `.env`.

Em outro terminal, na mesma raiz:

```powershell
npm run simulate
```

Digite `oi` e siga o menu. `/loc -23.55 -46.63` simula localização; `/foto` simula uma imagem; `/sair` fecha o simulador. As mensagens do bot aparecem no terminal do servidor. As linhas do simulador são processadas em sequência.

## Variáveis de ambiente

| Variável | Uso/padrão | Obrigatoriedade |
| --- | --- | --- |
| `SIMULATION_MODE` | `true` ativa console, fotos fictícias e backend simulado; sem valor, o modo é real | Defina explicitamente |
| `NODE_ENV` | Ambiente de execução; `production` proíbe simulação | Conforme implantação |
| `PORT` | Porta HTTP, padrão `3001`, inteiro entre 1 e 65535 | Opcional |
| `WEBHOOK_TOKEN` | Segredo do cabeçalho `x-webhook-token`; exemplo local não é segredo de produção | Sempre |
| `REDIS_URL` | URL `redis://` ou `rediss://` | Modo real; opcional na simulação |
| `EVOLUTION_URL` | URL HTTP(S) base da Evolution | Modo real |
| `EVOLUTION_INSTANCE` | Nome da instância conectada ao WhatsApp | Modo real |
| `EVOLUTION_APIKEY` | Chave enviada no cabeçalho `apikey` | Modo real |
| `BACKEND_URL` | URL HTTP(S) base da API de denúncias | Modo real |
| `BOT_API_KEY` | Segredo do cabeçalho `x-bot-key` | Modo real |
| `SUPABASE_URL` | URL HTTP(S) do projeto Supabase | Modo real |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de servidor para o upload | Modo real |
| `SUPABASE_BUCKET` | Nome do bucket de imagens | Modo real |
| `USE_FAKE_MESSENGER` | Compatibilidade com configuração antiga; não seleciona sozinho o modo | Evitar em novas configurações |
| `WEBHOOK_URL` | Destino do simulador, padrão `http://localhost:3001/webhook` | Só simulador |
| `SIM_NUMBER` | Telefone fictício, padrão `5599999999999` | Só simulador |

Flags aceitam as strings `true` ou `false`. `USE_FAKE_MESSENGER=true` é recusado no modo real; a seleção efetiva do mensageiro depende de `SIMULATION_MODE`. Se alterar PORT, ajuste WEBHOOK_URL no simulador também. Campos obrigatórios vazios e protocolos incorretos impedem a inicialização. A validação não comprova que as credenciais remotas são válidas.

## Redis local e modo real

```powershell
docker compose -f whatsapp-bot/docker-compose.yml up -d
```

No `.env`, use `REDIS_URL=redis://localhost:6379`, defina `SIMULATION_MODE=false` e preencha os serviços externos. O compose habilita AOF, sincronização em cada gravação, política `noeviction` e volume persistente; só expõe Redis em `127.0.0.1`. Isso é uma configuração local, não um provisionamento de infraestrutura de produção.

O compose não cria a Evolution API, o backend nem o Supabase, e não sobe a aplicação NestJS. Configure o webhook autenticado na Evolution conforme [Integrações](INTEGRACOES.md).

## Comandos disponíveis

| Comando na raiz | Finalidade |
| --- | --- |
| `npm run start:dev` | Executar com recompilação automática |
| `npm start` | Executar via Nest CLI |
| `npm run build` | Compilar somente src para `whatsapp-bot/dist` |
| `npm run start:prod` | Executar `dist/main.js` já compilado |
| `npm run simulate` | Abrir o simulador de webhooks |
| `npm run typecheck` | Conferir tipos de código, testes e simulador |
| `npm test` | Executar testes unitários em série |
| `npm run test:e2e` | Executar testes HTTP em série |
| `npm run lint` | Verificar regras estáticas e formatação |
| `npm run test:cov --workspace whatsapp` | Gerar cobertura local |
| `npm run format --workspace whatsapp` | Formatar src e test |

## Arquivos de configuração

`tsconfig.json` define resolução NodeNext, decorators e regras TypeScript. `tsconfig.build.json` restringe o build a src e define rootDir, evitando que o simulador mova a saída para `dist/src/main.js`. `nest-cli.json` escolhe src e limpa a saída no build. `eslint.config.mjs` combina regras TypeScript com Prettier; `.prettierrc` define estilo. `test/jest-e2e.json` carrega `setup-env.ts` antes de importar o módulo raiz. JSON não aceita comentários; por isso suas decisões estão documentadas aqui.

### Resolução dos imports

O projeto usa imports relativos para arquivos internos e nomes de pacotes para dependências. Por isso, `baseUrl` não é necessário e foi removido do tsconfig. A resolução continua como NodeNext. A opção também foi descontinuada no [TypeScript 6.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).
