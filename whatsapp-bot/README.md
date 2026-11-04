# Bot de denúncias por WhatsApp

NestJS com Evolution API, backend HTTP e Supabase Storage. A conversa coleta categoria, descrição, endereço, localização opcional e até cinco imagens.

Consulte também o [guia completo da Sigma Devs](../docs/README.md), com arquitetura, configuração, contratos, operação e mapa do código.

## Instalação e simulação

Requer Node.js 22 ou superior com npm. Execute na **raiz do repositório**, que usa npm workspaces e um único package-lock.json:

```powershell
npm ci
Copy-Item whatsapp-bot/.env.example whatsapp-bot/.env
npm run start:dev
```

Em outro terminal, na mesma raiz:

```powershell
npm run simulate
```

O simulador carrega `whatsapp-bot/.env`. Digite `oi` para começar e siga as perguntas. `/loc -23.55 -46.63` envia localização, `/foto` simula imagem e `/sair` encerra. `voltar` retorna uma etapa e `cancelar` encerra a denúncia.

Com `SIMULATION_MODE=true`, mensagens aparecem no console, fotos usam URLs fictícias e o backend não é chamado. A conclusão informa claramente que nenhuma denúncia foi registrada. Sem REDIS_URL, o estado é temporário e limitado a um processo. O modo de simulação é recusado quando NODE_ENV=production.

## Modo real

1. Defina `SIMULATION_MODE=false` e preencha todas as variáveis do `.env.example`. A aplicação valida os campos na inicialização. USE_FAKE_MESSENGER é uma opção antiga; não a utilize no modo real.
2. Para Redis local: `docker compose -f whatsapp-bot/docker-compose.yml up -d` e `REDIS_URL=redis://localhost:6379`. O compose fornece apenas Redis; Evolution, backend e Supabase são serviços externos.
3. Todas as réplicas do bot devem usar o mesmo Redis e EVOLUTION_INSTANCE. Cada implantação atende uma instância Evolution. Sessões expiram após 30 minutos; respostas para deduplicação são mantidas por 24 horas. O Redis precisa de persistência e política noeviction. A perda dos dados do Redis também perde essas garantias.
4. Na Evolution, configure eventos `messages.upsert` para `POST https://seu-bot/webhook` e o cabeçalho `x-webhook-token` com o mesmo WEBHOOK_TOKEN. Use um segredo forte e HTTPS. O parser aceita conversas diretas com JID numérico `@s.whatsapp.net`; grupos e endereçamento `@lid` não são suportados nesta versão.
5. A integração de mídia usa `POST /chat/getBase64FromMediaMessage/{instance}` com a chave da mensagem. Imagens JPEG/PNG/WebP são baixadas pela API autenticada, têm tamanho limitado a 5 MB e assinatura básica de arquivo verificada antes do upload. Vídeos e documentos são recusados. Os caminhos de upload são determinísticos para permitir repetição sem multiplicar arquivos.
6. Configure o bucket Supabase. O contrato atual do backend espera **URLs públicas**: o bucket deve ser público e as imagens poderão ser vistas por quem tiver o link. Os caminhos não contêm telefone. Para denúncias com anexos confidenciais, altere também o contrato do backend para objetos privados/URLs assinadas antes de usar dados reais. Credenciais service_role ficam somente no servidor.

## Contrato do backend e tentativas

`POST {BACKEND_URL}/bot/complaints`, com `x-bot-key`, corpo `{ category, description, address, latitude?, longitude?, photos: string[], origem: "whatsapp", telefone }` e resposta `{ "id": "protocolo" }`.

O bot só confirma o registro após receber um protocolo válido. Erros mantêm o rascunho; `sim` tenta novamente e `voltar` permite corrigir dados. O backend recebe `Idempotency-Key`, estável para o mesmo rascunho e payload. **O backend precisa implementar esse cabeçalho atomicamente**: salvar chave, payload e resultado e devolver o mesmo protocolo em repetições. Sem esse suporte, um timeout após criar a denúncia pode gerar registro duplicado. O código do backend não faz parte deste repositório.

Mensagens por usuário são serializadas com bloqueio compartilhado. A nova sessão e a resposta ficam gravadas atomicamente antes do envio ao WhatsApp. Se o envio falhar, o endpoint devolve erro e uma repetição do mesmo webhook reenvia a resposta salva sem executar a etapa novamente. Configure retries na Evolution. Se o provedor aceitar um envio mas a conexão cair antes da confirmação, uma resposta poderá chegar repetida: não há garantia de entrega exatamente uma vez no provedor. O webhook processa uma mensagem por payload e depende do ordenamento de chegada do provedor.

Fotos são enviadas ao armazenamento ao serem recebidas. Cancelamentos e sessões expiradas podem deixar anexos sem denúncia; configure retenção e limpeza de arquivos órfãos no armazenamento conforme a política do sistema.

## Validação e execução

```powershell
npm run build
npm run typecheck
npm test
npm run test:e2e
npm run lint
npm run start:prod
```

Os testes automatizados cobrem o fluxo, confirmação, retorno de etapas, falhas de backend/upload/envio, repetição de webhook, concorrência, limites de fotos, validação de payload e expiração. Integrações externas reais exigem credenciais e homologação. O bot não usa IA: as perguntas e validações são uma máquina de estados.

Referências: [Evolution Get Base64](https://docs.evoapicloud.com/api-reference/chat-controller/get-base64), [Redis Node.js](https://redis.io/docs/latest/develop/clients/nodejs/connect/).

Com carinho, **Sigma Devs**.
