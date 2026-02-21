// ==========================================
// ChronosFlow - Constants
// ==========================================

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Urgente',
  2: 'Alta',
  3: 'Média',
  4: 'Baixa',
}

export const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-blue-400',
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluída',
}

export const SESSION_TYPE_LABELS: Record<string, string> = {
  WORK: 'Trabalho',
  STUDY: 'Estudo',
}

export const CATEGORY_TYPE_LABELS: Record<string, string> = {
  WORK: 'Trabalho',
  STUDY: 'Estudo',
  PERSONAL: 'Pessoal',
}
