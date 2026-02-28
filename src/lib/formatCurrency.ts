// ==========================================
// ChronosFlow — Formatação de Moeda (BRL)
// ==========================================

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/**
 * Formata um valor numérico para Real brasileiro (R$).
 *
 * @example
 * formatCurrency(1500.5)  // "R$ 1.500,50"
 * formatCurrency(-42)     // "-R$ 42,00"
 */
export function formatCurrency(value: number): string {
  return BRL.format(value)
}
