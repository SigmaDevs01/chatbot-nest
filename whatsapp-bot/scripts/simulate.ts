import 'dotenv/config';
// scripts/simulate.ts
import * as readline from 'readline';

/**
 * Script CLI Interativo de Simulação do WhatsApp.
 *
 * Permite conversar com o bot localmente através do terminal, simulando
 * o envio de webhooks idênticos aos gerados pela Evolution API.
 *
 * Como rodar:
 * `npx ts-node scripts/simulate.ts`
 *
 * Comandos suportados no terminal:
 * - Texto livre: Envia como mensagem de texto normal do usuário.
 * - `/loc <latitude> <longitude>`: Simula o envio de localização GPS do WhatsApp (ex: `/loc -23.5505 -46.6333`).
 * - `/foto`: Simula o envio de uma foto com mídia anexada.
 * - `/sair`: Encerra a simulação no terminal.
 */

const URL = process.env.WEBHOOK_URL ?? 'http://localhost:3001/webhook';
const TOKEN = process.env.WEBHOOK_TOKEN;
if (!TOKEN) throw new Error('Configure WEBHOOK_TOKEN no .env');
const NUMBER = process.env.SIM_NUMBER ?? '5599999999999';
let seq = 0;

/**
 * Monta o payload no padrão `messages.upsert` da Evolution API e faz um POST para o webhook.
 */
async function send(message: object) {
  const body = {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: `${NUMBER}@s.whatsapp.net`,
        fromMe: false,
        id: `SIM-${Date.now()}-${seq++}`,
      },
      message,
    },
  };

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-token': TOKEN! },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error('❌ Erro HTTP retornado pelo webhook:', res.status);
  }
}

// Inicializa a interface de leitura de linha de comando no terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
console.log('🤖 Simulador do Bot de Denúncias via Terminal');
console.log('Comandos: Digite texto normal | /loc <lat> <lng> | /foto | /sair');
console.log(
  'As respostas do bot aparecem no terminal onde o NestJS está rodando.\n',
);

// Loop de eventos que escuta cada linha digitada pelo desenvolvedor
// Serializa entradas do terminal para não enviar respostas fora da ordem esperada.
// A falha de uma requisição é tratada na cauda, permitindo continuar a simulação.
let pending = Promise.resolve();
rl.on('line', (line) => {
  pending = pending
    .then(async () => {
      const [cmd, a, b] = line.trim().split(' ');

      if (cmd === '/sair') {
        return rl.close();
      }

      if (cmd === '/loc') {
        return send({
          locationMessage: {
            degreesLatitude: Number(a),
            degreesLongitude: Number(b),
          },
        });
      }

      if (cmd === '/foto') {
        return send({
          imageMessage: {
            caption: '',
            mimetype: 'image/jpeg',
          },
        });
      }

      // Texto livre padrão
      await send({ conversation: line });
    })
    .catch((error: unknown) =>
      console.error(
        'Falha na simulação:',
        error instanceof Error ? error.message : 'erro desconhecido',
      ),
    );
});
