# Contratos das integrações

## Entrada: Evolution → bot

```http
POST /webhook
Content-Type: application/json
x-webhook-token: <WEBHOOK_TOKEN>
```

Exemplo sintético de texto:

```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "id": "exemplo-0001",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": { "conversation": "oi" }
  }
}
```

O mesmo evento reenviado deve preservar `key.id`. Use outro ID para uma mensagem nova. O parser aceita um objeto de mensagem por chamada. Não há processamento de lotes, grupos, status ou JIDs `@lid`. O número deve ter de 8 a 15 dígitos; o ID deve ser string não vazia de até 200 caracteres. Texto simples e `extendedTextMessage.text` são limitados a 4096 caracteres. Uma camada de `ephemeralMessage` ou `viewOnceMessage` é desembrulhada.

Localização usa `locationMessage.degreesLatitude` e `degreesLongitude`, finitos e dentro de [-90, 90] e [-180, 180]. Localização inválida não é repassada à etapa. `imageMessage` marca imagem; vídeo, documento, áudio e sticker continuam sendo mídia, mas não foto aceita.

| Resposta HTTP | Significado para o provedor |
| --- | --- |
| `200 { "ok": true }` | Processamento e envio da resposta concluídos |
| `200 { "duplicate": true }` | Mesmo ID já marcado como entregue |
| `200 { "ignored": true }` | Evento não atende ao contrato do parser |
| `401` | Token ausente ou incorreto |
| `5xx` | Falha propagada; configurar retry no provedor |

Erros de backend/upload tratados pela conversa podem resultar em HTTP 200: nesse caso, o cidadão recebeu uma orientação de correção/reenvio. Não há endpoint de consulta de protocolo neste projeto.

## Saída: bot → Evolution

Texto: `POST {EVOLUTION_URL}/message/sendText/{EVOLUTION_INSTANCE}`, cabeçalho `apikey`, corpo `{ "number": "5511999999999", "text": "..." }`.

Imagem: `POST {EVOLUTION_URL}/chat/getBase64FromMediaMessage/{EVOLUTION_INSTANCE}`, mesmo cabeçalho, corpo:

```json
{
  "message": {
    "key": {
      "id": "exemplo-foto-0001",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    }
  },
  "convertToMp4": false
}
```

Espera-se `base64` como string e, quando disponível, `mimetype`; na ausência do MIME na resposta, usa-se o informado pela imagem no webhook. O download suporta base64 puro ou prefixo data:. O timeout é 15 segundos; a resposta HTTP é limitada a 8 MiB e o binário a 5 MiB. Homologue esse contrato com a versão da Evolution instalada.

## Fotos: bot → Supabase

São permitidos JPEG, PNG e WebP. O StorageService verifica MIME, assinatura básica e tamanho antes de chamar o SDK. Essa checagem não decodifica a imagem inteira e não substitui antivírus. O cliente é inicializado sob demanda, com timeout de 15 segundos nas requisições.

O caminho é `whatsapp/<sha256 da identidade da mensagem + bytes>.<extensão>`. Repetições da mesma foto usam `upsert=true` no mesmo caminho. Telefones não aparecem diretamente no nome do objeto. `getPublicUrl` produz a URL entregue ao backend; o bucket precisa permitir leitura pública. Para anexos privados, também é necessário alterar o contrato de leitura do backend.

Uploads ocorrem na etapa FOTOS, antes da confirmação. Cancelar, expirar a sessão ou voltar não apaga o objeto remoto. A limpeza de arquivos órfãos e a retenção precisam ser implementadas pela operação do armazenamento. Nenhum job de limpeza está incluído aqui.

## Denúncia: bot → backend

```http
POST {BACKEND_URL}/bot/complaints
Content-Type: application/json
x-bot-key: <BOT_API_KEY>
Idempotency-Key: <hash estável do rascunho e payload>
```

```json
{
  "category": "Buraco na via / rua",
  "description": "Há um buraco grande próximo ao cruzamento.",
  "address": "Rua Exemplo, 123, Centro",
  "latitude": -23.55,
  "longitude": -46.63,
  "photos": ["https://storage.example/whatsapp/imagem.jpg"],
  "origem": "whatsapp",
  "telefone": "5511999999999"
}
```

Coordenadas são opcionais; `photos` pode ser um array vazio. Categorias são as strings oficiais de `src/conversation/categories.ts`. O timeout é 15 segundos. Uma resposta de sucesso precisa conter `{ "id": "DEN-2026-0042" }`, com id string não vazia. Resposta sem protocolo não gera mensagem de sucesso ao cidadão.

Erros de validação 400 podem retornar `{ "message": "..." }` ou `{ "message": ["...", "..."] }`. As strings são apresentadas ao cidadão para correção: o backend deve devolver conteúdo apropriado, sem stack trace ou segredo. Outros erros orientam uma nova tentativa.

### Responsabilidade da idempotência no backend

O backend externo precisa guardar a chave, o conteúdo associado e o resultado junto da criação da denúncia, de forma atômica. Repetições com a mesma chave e conteúdo devem devolver o protocolo original. Chave reutilizada com conteúdo diferente deve ser tratada como conflito. Esse contrato precisa ser implementado na API externa; este repositório apenas envia o cabeçalho.

Sem isso, se a API criar o registro e a resposta se perder, um novo `sim` pode duplicar a denúncia. Depois de editar os dados, o bot gera uma chave diferente. A retenção de chaves do backend deve cobrir sua política de tentativas e de recuperação.
