# Histórico das correções e documentação

## Correções do fluxo

| Situação anterior | Implementação atual |
| --- | --- |
| Webhook respondia com eco | Controller chama o fluxo conversacional |
| Finalização retornava protocolo fixo de simulação | Backend real com protocolo validado; simulação explicitamente identificada |
| ID marcado antes de concluir envio, sem resposta recuperável | Resposta persistida antes do envio e reutilizada nos retries |
| Fotos eram IDs de mensagens, incluindo documentos/vídeos | Download, validação e upload; rascunho guarda URLs de imagens |
| Sessões somente em memória | Redis no modo real; memória limitada para simulação |
| Expiração dependia do retorno do usuário | TTL Redis ou varredura periódica em memória |
| Dependências divididas sem instalação unificada | Workspace npm, declarações na aplicação e lockfile único na raiz |
| `.env.example` e compose vazios | Ambiente documentado e Redis local com persistência |
| Testes limitados ao scaffold | Suítes de fluxo, validação, recuperação de falhas e armazenamento |
| Build podia incluir scripts e mudar o local de main.js | Build restrito a src, saída dist/main.js |

Também foram adicionadas validação de configuração, comparação segura do token, timeouts finitos, proteção de tamanho de mídia e chave de idempotência para a API externa. O serviço antigo de sessões em memória foi substituído pelo adaptador PersistentSessionStore sobre StateService.

## Branch de documentação

Branch local: `codex/correcoes-documentacao-sigma-devs`.

Esta etapa acrescenta guias, mapa de arquivos, comentários de contratos/métodos e explicações das decisões de concorrência. Corrige comentários antigos que atribuíam ao complaintId o significado de etapa, tratavam IDs como URLs de fotos ou descreviam mídias em lote não suportadas. Arquivos JSON são explicados na documentação, preservando seu formato válido.

## Pendências externas e limites

- Implementação de Idempotency-Key no backend externo.
- Credenciais e homologação real de todos os serviços, incluindo Redis.
- Política de privacidade e leitura das imagens; contrato atual usa URLs públicas.
- Retenção e remoção de arquivos órfãos no Supabase.
- JIDs @lid, lotes de mensagens, ordenação por horário original e consulta de protocolo não implementados.
- Redis Cluster/Sentinel e reconexão automática não implementados.
- Endpoint dedicado de saúde/monitoramento não implementado.

A documentação diferencia essas pendências das funcionalidades já existentes. Não há garantia de entrega exatamente uma vez ao WhatsApp.

Com carinho, **Sigma Devs**.
