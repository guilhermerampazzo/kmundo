export const pedidoStatusLabel: Record<string, string> = {
  SOLICITADO: 'Solicitado',
  EM_ANALISE: 'Em análise',
  COTACAO_DISPONIVEL: 'Cotação disponível',
  AGUARDANDO_CONFIRMACAO_CLIENTE: 'Aguardando confirmação do cliente',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGAMENTO_FEITO: 'Pagamento feito',
  COMPRADO: 'Comprado',
  CANCELADO: 'Cancelado',
  // legados (fluxo antigo, migrados no banco mas mantidos p/ compat)
  AGUARDANDO_REVISAO: 'Solicitado',
  AGUARDANDO_CONFIRMACAO: 'Pagamento feito',
  PAGO: 'Pagamento feito',
}

export const pedidoStatusColors: Record<string, string> = {
  SOLICITADO: '#F59E0B',
  EM_ANALISE: '#EAB308',
  COTACAO_DISPONIVEL: '#8B5CF6',
  AGUARDANDO_CONFIRMACAO_CLIENTE: '#F97316',
  AGUARDANDO_PAGAMENTO: '#7C3AED',
  PAGAMENTO_FEITO: '#3B82F6',
  COMPRADO: '#22C55E',
  CANCELADO: '#EF4444',
  AGUARDANDO_REVISAO: '#F59E0B',
  AGUARDANDO_CONFIRMACAO: '#3B82F6',
  PAGO: '#3B82F6',
}

// Agrupamento para tabs admin/cliente
export const pedidoStatusTabs = [
  { label: 'Todos', value: '' },
  { label: 'Solicitado', value: 'SOLICITADO' },
  { label: 'Em análise', value: 'EM_ANALISE' },
  { label: 'Cotação disponível', value: 'COTACAO_DISPONIVEL' },
  { label: 'Ag. confirmação cliente', value: 'AGUARDANDO_CONFIRMACAO_CLIENTE' },
  { label: 'Aguardando pagamento', value: 'AGUARDANDO_PAGAMENTO' },
  { label: 'Pagamento feito', value: 'PAGAMENTO_FEITO' },
  { label: 'Comprado', value: 'COMPRADO' },
  { label: 'Cancelado', value: 'CANCELADO' },
] as const

export function isPagoConfirmado(status: string) {
  return status === 'PAGAMENTO_FEITO' || status === 'COMPRADO' || status === 'PAGO'
}

// Ordem do funil para timeline no painel do cliente
export const pedidoFluxo = [
  'SOLICITADO',
  'EM_ANALISE',
  'COTACAO_DISPONIVEL',
  'AGUARDANDO_CONFIRMACAO_CLIENTE',
  'AGUARDANDO_PAGAMENTO',
  'PAGAMENTO_FEITO',
  'COMPRADO',
] as const
