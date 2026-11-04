// src/conversation/categories.ts

/**
 * Lista oficial de categorias de problemas urbanos aceitas pela aplicação.
 *
 * ⚠️ IMPORTANTE: Esta lista deve ser IDÊNTICA à lista esperada pela API do backend,
 * pois o backend costuma validar os dados usando validação estrita (ex.: `@IsIn(...)`).
 * Qualquer alteração aqui deve refletir no backend.
 */
export const VALID_CATEGORIES = [
  'Buraco na via / rua',
  'Entulho',
  'Lixo acumulado',
  'Iluminação pública',
  'Problemas em calçadas',
  'Sinalização danificada',
  'Semáforo com defeito',
  'Pavimentação',
  'Drenagem / alagamento',
  'Árvore ou vegetação interferindo na via (Poda/Manejo)',
  'Outros problemas de infraestrutura.',
];
