// src/conversation/messages.ts
import { VALID_CATEGORIES } from './categories';
import { Draft } from './session/session.types';

/**
 * Catálogo centralizado de mensagens do Bot.
 *
 * Centraliza todos os templates de texto, perguntas e mensagens de erro enviadas ao cidadão.
 * Facilita a manutenção de tom de voz, correções ortográficas e futuras traduções.
 */
export const messages = {
  /** Mensagem enviada logo no início de uma nova conversa */
  welcome:
    '👋 Olá! Vou te ajudar a registrar uma denúncia.\n' +
    'A qualquer momento: *cancelar* encerra e *voltar* retorna uma pergunta.\n',

  /** Pergunta do passo 1: Exibe a lista numerada de categorias */
  categoria: () =>
    'Qual o tipo de problema? Responda com o *número*:\n' +
    VALID_CATEGORIES.map((c, i) => `${i + 1}) ${c}`).join('\n'),

  /** Pergunta do passo 2: Solicita descrição detalhada */
  descricao: () =>
    'Descreva o problema (o que está acontecendo, há quanto tempo, etc.).',

  /** Pergunta do passo 3: Solicita o endereço */
  endereco: () =>
    'Informe o *endereço* (rua, número, bairro e ponto de referência).',

  /** Pergunta do passo 4: Solicita coordenadas geográficas */
  coordenadas: () =>
    'Se puder, envie a *localização* pelo WhatsApp (📎 > Localização) para marcar o ponto exato.\n' +
    'Ou digite *pular*.',

  /** Pergunta do passo 5: Solicita envio de fotos */
  fotos: () =>
    'Envie até 5 *fotos* (opcional). Quando terminar, digite *pronto*. Para não enviar, digite *pular*.',

  /** Pergunta do passo 6: Apresenta o resumo da denúncia para confirmação final */
  confirmacao: (d: Draft) =>
    '📋 *Resumo da denúncia*\n' +
    `Categoria: ${d.category}\n` +
    `Descrição: ${d.description}\n` +
    `Endereço: ${d.address}\n` +
    `Localização: ${d.latitude != null ? `${d.latitude}, ${d.longitude}` : 'não informada'}\n` +
    `Fotos: ${d.photoUrls.length}\n\n` +
    'Confirma o envio? Responda *sim* ou *não*.',

  /** Mensagem enviada quando o usuário digita "cancelar" ou responde "não" na confirmação */
  cancelled: 'Denúncia cancelada. Envie qualquer mensagem para recomeçar.',

  /** Aviso quando o usuário digita "voltar" mas já está na primeira pergunta */
  firstQuestion: 'Você já está na primeira pergunta.',

  /** Mensagem de sucesso contendo o número do protocolo retornado pela API */
  finished: (id: string) => `✅ Denúncia registrada! Protocolo: ${id}`,

  /** Mensagem de erro caso a chamada de rede ou a API falhe no envio final */
  sendFailed:
    '⚠️ Não consegui enviar agora. Responda *sim* para tentar de novo ou *cancelar*.',

  /** Mensagem de erro caso o backend recuse os dados com status 400 */
  invalidData: (d: string) =>
    `⚠️ O sistema recusou alguns dados:\n${d}\n\nDigite *voltar* para corrigir.`,
};
