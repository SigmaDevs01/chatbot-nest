# Operação, testes e manutenção

## Verificações de desenvolvimento

Execute na raiz, depois de instalar as dependências:

```powershell
npm run typecheck
npm run build
npm test
npm run test:e2e
npm run lint
```

`typecheck` inclui testes e simulador. O build compila apenas a aplicação. Os testes usam Jest/ts-jest; a verificação explícita de tipos é necessária porque a transformação isolada dos testes não substitui o compilador completo.

## Cobertura existente

| Suíte | O que verifica |
| --- | --- |
| `app.controller.spec.ts` | Exemplo legado Hello World, sem registro de rota no AppModule |
| `config.spec.ts` | Ambiente de simulação, proibição em produção, campos obrigatórios e porta |
| `webhook.parser.spec.ts` | Payload malformado, texto, remetente, localização e mídia |
| `common/state.service.spec.ts` | TTL, cópias, falha de processamento, lote descartado e deduplicação concorrente em memória |
| `backend/backend.client.spec.ts` | Protocolo real, chave de idempotência e erro de validação, com HTTP simulado |
| `storage/storage.service.spec.ts` | Inicialização adiada, assinatura inválida e caminho estável, com SDK simulado |
| `test/app.e2e-spec.ts` | Guard HTTP, fluxo completo, fotos, cancelamento, voltar, retries e mensagens simultâneas |

A validação das correções anteriores passou em **38 testes**: 26 unitários e 12 HTTP. Também passaram build NestJS, verificação completa de tipos, lint sem avisos e um teste de inicialização do servidor compilado em simulação.

Esses resultados foram obtidos em cópia temporária com o mesmo código, porque a instalação de dependências na pasta original apresentou erros de permissão. Eles não comprovam comunicação real com Redis, Evolution, Supabase ou API de denúncias. Nesta revisão de documentação, a equivalência do JavaScript emitido é verificada para garantir que comentários não alterem comportamento.

## Homologação dos serviços reais

Use um ambiente de testes e um número autorizado. Confira o token do webhook, entrega de texto, uma imagem de cada formato, localização e criação de uma denúncia com protocolo. Valide um erro 400, uma indisponibilidade temporária e a recuperação de envio. Confirme no backend que repetir a mesma chave não cria outro registro.

Com Redis real, confira TTL, persistência após reiniciar o bot e coordenação entre duas réplicas da mesma instância Evolution. Não limpe o banco durante a homologação de deduplicação. Valide reinício após indisponibilidade Redis: o cliente atual não se reconecta automaticamente.

## Diagnóstico

| Sintoma | Conferir |
| --- | --- |
| Falha na inicialização por variável ausente | `.env` em whatsapp-bot, modo selecionado e campos obrigatórios |
| HTTP 401 | `x-webhook-token` idêntico ao WEBHOOK_TOKEN |
| HTTP 200 com ignored | event, fromMe, ID, JID numérico, tipo/tamanho do texto |
| Resposta só aparece no terminal | SIMULATION_MODE está true |
| Upload recusado | Formato/assinatura, 5 MiB, credenciais, bucket e disponibilidade da Evolution |
| URL de foto inacessível | Bucket público e políticas de leitura compatíveis |
| Mensagem de tentativa novamente | Disponibilidade, timeout ou resposta sem protocolo do backend |
| Falha Redis ou conversa ocupada | Conectividade, memória disponível, bloqueios e reinício do serviço |
| npm ci falha no Windows/OneDrive | Permissões e bloqueios de arquivos; execute no terminal do usuário ou em checkout local fora da sincronização |
| GET / retorna 404 | Comportamento atual; não existe health check registrado |

O modo de simulação escreve telefone e resposta no console: use dados fictícios. No modo real, o fluxo não registra o payload completo da denúncia nos logs de sucesso. Segredos pertencem ao ambiente, não ao Git. O arquivo `.env.example` contém apenas exemplos.

## Regras para futuras alterações

- Nova etapa: atualizar StepName, STEP_ORDER, STEPS, mensagens e testes de navegação.
- Nova categoria: alinhar a string com a validação do backend antes de disponibilizar.
- Nova mídia: atualizar parser, tipos, validação binária, limite e contrato de armazenamento.
- Novo provedor: implementar Messenger e selecionar a implementação no módulo.
- Novo armazenamento: preservar TTL, isolamento de usuários e ordem sessão/resposta/envio.
- Nova tentativa automática: considerar efeitos externos e idempotência; não marcar entregue antes de confirmar envio.
- Nova configuração: atualizar validateConfig, `.env.example` e a tabela de configuração.

Comentários devem explicar contratos e decisões. Mantenha exemplos sem credenciais reais e revise os documentos quando os limites ou o comportamento mudarem.
