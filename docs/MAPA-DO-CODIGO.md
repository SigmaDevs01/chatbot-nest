# Mapa do código

Todos os arquivos TypeScript de aplicação, testes e simulador estão listados abaixo. Os caminhos partem do workspace whatsapp-bot.

| Arquivo | Responsabilidade |
| --- | --- |
| [src/app.controller.spec.ts](../whatsapp-bot/src/app.controller.spec.ts) | Teste legado do scaffold. |
| [src/app.controller.ts](../whatsapp-bot/src/app.controller.ts) | Exemplo legado do scaffold: não está registrado no AppModule nem serve como health check. |
| [src/app.module.ts](../whatsapp-bot/src/app.module.ts) | Módulo Raiz da Aplicação (AppModule). |
| [src/app.service.ts](../whatsapp-bot/src/app.service.ts) | Serviço demonstrativo do scaffold, mantido para o teste legado de Hello World. |
| [src/backend/backend.client.spec.ts](../whatsapp-bot/src/backend/backend.client.spec.ts) | Contrato do cliente HTTP: protocolo válido, cabeçalho de idempotência e erros de validação. |
| [src/backend/backend.client.ts](../whatsapp-bot/src/backend/backend.client.ts) | Único cliente de criação de denúncias; concentra autenticação e contrato HTTP. |
| [src/backend/backend.error.ts](../whatsapp-bot/src/backend/backend.error.ts) | Erro customizado disparado quando a chamada à API de denúncias falha. |
| [src/backend/backend.module.ts](../whatsapp-bot/src/backend/backend.module.ts) | Módulo de Integração com o Backend (BackendModule). |
| [src/backend/dto/create-complaint.payload.ts](../whatsapp-bot/src/backend/dto/create-complaint.payload.ts) | Payload consolidado enviado para a API de denúncias ao finalizar o fluxo do bot. |
| [src/common/common.module.ts](../whatsapp-bot/src/common/common.module.ts) | Compartilha uma única persistência e um único coordenador de entrega no processo. |
| [src/common/idempotency.service.ts](../whatsapp-bot/src/common/idempotency.service.ts) | Resposta já calculada e confirmação local de entrega ao provedor. |
| [src/common/state.service.spec.ts](../whatsapp-bot/src/common/state.service.spec.ts) | Verifica TTL, isolamento, rollback das alterações pendentes em memória e concorrência local. |
| [src/common/state.service.ts](../whatsapp-bot/src/common/state.service.ts) | Persistência compartilhada e coordenação das conversas. |
| [src/config.spec.ts](../whatsapp-bot/src/config.spec.ts) | Verifica inicialização segura dos modos de simulação e produção e validação da porta. |
| [src/config.ts](../whatsapp-bot/src/config.ts) | Valida o ambiente na inicialização do ConfigModule e normaliza PORT. |
| [src/conversation/categories.ts](../whatsapp-bot/src/conversation/categories.ts) | Lista oficial de categorias de problemas urbanos aceitas pela aplicação. |
| [src/conversation/conversation.module.ts](../whatsapp-bot/src/conversation/conversation.module.ts) | Módulo de Conversação (ConversationModule). |
| [src/conversation/conversation.service.ts](../whatsapp-bot/src/conversation/conversation.service.ts) | Orquestrador da Máquina de Estados da Conversa (ConversationService). |
| [src/conversation/messages.ts](../whatsapp-bot/src/conversation/messages.ts) | Catálogo centralizado de mensagens do Bot. |
| [src/conversation/session/persistent-session.store.ts](../whatsapp-bot/src/conversation/session/persistent-session.store.ts) | Adapta o contrato de sessões ao StateService e define expiração de 30 minutos. |
| [src/conversation/session/session.store.ts](../whatsapp-bot/src/conversation/session/session.store.ts) | Contrato (Interface) para persistência e recuperação de sessões de conversa. |
| [src/conversation/session/session.types.ts](../whatsapp-bot/src/conversation/session/session.types.ts) | Nomes de todos os passos possíveis da máquina de estados conversacional. |
| [src/conversation/steps/categoria.step.ts](../whatsapp-bot/src/conversation/steps/categoria.step.ts) | Passo 1: Seleção da Categoria do Problema. |
| [src/conversation/steps/confirmacao.step.ts](../whatsapp-bot/src/conversation/steps/confirmacao.step.ts) | Passo 6: Confirmação e Revisão Final da Denúncia. |
| [src/conversation/steps/coordenadas.step.ts](../whatsapp-bot/src/conversation/steps/coordenadas.step.ts) | Passo 4: Coordenadas Geográficas (GPS via WhatsApp). |
| [src/conversation/steps/descricao.step.ts](../whatsapp-bot/src/conversation/steps/descricao.step.ts) | Passo 2: Descrição Detalhada do Problema. |
| [src/conversation/steps/endereco.step.ts](../whatsapp-bot/src/conversation/steps/endereco.step.ts) | Passo 3: Endereço Textual do Problema. |
| [src/conversation/steps/fotos.step.ts](../whatsapp-bot/src/conversation/steps/fotos.step.ts) | Limite máximo de fotos aceitas por denúncia. |
| [src/conversation/steps/index.ts](../whatsapp-bot/src/conversation/steps/index.ts) | Registro e Dicionário de todos os passos (`STEPS`). |
| [src/conversation/steps/step.interface.ts](../whatsapp-bot/src/conversation/steps/step.interface.ts) | Resultado da avaliação de uma mensagem em qualquer passo da conversa: - `next`: Entrada válida; avança para o próximo passo especificado. |
| [src/conversation/text.util.ts](../whatsapp-bot/src/conversation/text.util.ts) | Função utilitária para sanitização e normalização de strings enviadas pelo usuário. |
| [src/main.ts](../whatsapp-bot/src/main.ts) | Função de inicialização da aplicação NestJS. |
| [src/messaging/console.messenger.ts](../whatsapp-bot/src/messaging/console.messenger.ts) | Provedor de Mensagens Simulado para Desenvolvimento (ConsoleMessenger). |
| [src/messaging/evolution.client.ts](../whatsapp-bot/src/messaging/evolution.client.ts) | Limite binário por imagem; base64 ocupa aproximadamente 4/3 desse tamanho. |
| [src/messaging/messaging.module.ts](../whatsapp-bot/src/messaging/messaging.module.ts) | Módulo de Mensageria (MessagingModule). |
| [src/messaging/messenger.ts](../whatsapp-bot/src/messaging/messenger.ts) | Contrato (Interface) para qualquer mecanismo de envio de mensagens do WhatsApp. |
| [src/storage/photo.service.ts](../whatsapp-bot/src/storage/photo.service.ts) | Faz a ponte entre o download autenticado da Evolution e o upload no Supabase. |
| [src/storage/storage.module.ts](../whatsapp-bot/src/storage/storage.module.ts) | Expõe PhotoService; detalhes do Supabase ficam encapsulados no módulo. |
| [src/storage/storage.service.spec.ts](../whatsapp-bot/src/storage/storage.service.spec.ts) | Valida rejeição de assinatura incompatível e caminho determinístico. |
| [src/storage/storage.service.ts](../whatsapp-bot/src/storage/storage.service.ts) | Lista permitida; MIME desconhecido não recebe extensão padrão. |
| [src/webhook/dto/incoming-message.ts](../whatsapp-bot/src/webhook/dto/incoming-message.ts) | DTO que padroniza o formato interno de qualquer mensagem recebida pelo Bot. |
| [src/webhook/webhook.controller.ts](../whatsapp-bot/src/webhook/webhook.controller.ts) | Entrada HTTP: autenticar → normalizar → deduplicar → conversar → entregar. |
| [src/webhook/webhook.guard.ts](../whatsapp-bot/src/webhook/webhook.guard.ts) | Exige o segredo compartilhado no cabeçalho antes de processar qualquer evento. |
| [src/webhook/webhook.module.ts](../whatsapp-bot/src/webhook/webhook.module.ts) | Módulo de Webhook (WebhookModule). |
| [src/webhook/webhook.parser.spec.ts](../whatsapp-bot/src/webhook/webhook.parser.spec.ts) | Exercita payloads malformados, filtros de remetente, texto, localização e classificação de mídia. |
| [src/webhook/webhook.parser.ts](../whatsapp-bot/src/webhook/webhook.parser.ts) | Permite inspecionar JSON desconhecido sem assumir objetos, arrays ou strings. |
| [scripts/simulate.ts](../whatsapp-bot/scripts/simulate.ts) | Script CLI Interativo de Simulação do WhatsApp. |
| [test/app.e2e-spec.ts](../whatsapp-bot/test/app.e2e-spec.ts) | Integração HTTP real do NestJS com transporte WhatsApp, backend e fotos simulados. |
| [test/setup-env.ts](../whatsapp-bot/test/setup-env.ts) | Executado pelo Jest antes de importar AppModule, pois ConfigModule valida o ambiente durante a importação. |

## Configuração e dependências

- `package.json` da raiz: comandos delegados e declaração do workspace.
- `package-lock.json` da raiz: versões resolvidas, compartilhadas pela instalação npm ci.
- `whatsapp-bot/package.json`: dependências, scripts e configuração de testes unitários.
- `whatsapp-bot/tsconfig.json` e `tsconfig.build.json`: verificação TypeScript e escopo da compilação.
- `whatsapp-bot/nest-cli.json`: configuração do Nest CLI.
- `whatsapp-bot/eslint.config.mjs` e `.prettierrc`: análise estática e estilo.
- `whatsapp-bot/test/jest-e2e.json`: suíte HTTP e preparação do ambiente.
- `whatsapp-bot/.env.example`: campos de configuração sem segredos reais.
- `whatsapp-bot/docker-compose.yml`: Redis local com volume persistente.
- Arquivos `.gitignore`: exclusão de dependências, build, logs e segredos do versionamento.

Lockfiles são gerados pelo npm; não devem receber comentários manuais. O índice completo dos guias está em [README](README.md).
