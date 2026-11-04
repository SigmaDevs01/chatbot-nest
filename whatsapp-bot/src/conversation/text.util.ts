// src/conversation/text.util.ts

/**
 * Função utilitária para sanitização e normalização de strings enviadas pelo usuário.
 *
 * Transformações aplicadas:
 * 1. Converte para minúsculas.
 * 2. Remove acentos e diacríticos (ex.: "Não" vira "nao", "É" vira "e").
 * 3. Remove pontuações e símbolos especiais (ex.: "Sim!" vira "sim", "1." vira "1").
 * 4. Remove múltiplos espaços em branco consecutivos e remove espaços nas pontas (`trim`).
 *
 * @param text - Texto bruto digitado pelo cidadão no WhatsApp.
 * @returns Texto padronizado para comparação segura em condicionais.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
