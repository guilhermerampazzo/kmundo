import { z } from 'zod'

export const pedidoCompraItemSchema = z.object({
  produtoShopId: z.string().optional(),
  nomeProduto: z.string().min(2, 'Informe o nome do produto'),
  urlProduto: z.string().url('Informe um link válido').optional().or(z.literal('')),
  quantidade: z.number().int().min(1, 'Quantidade mínima é 1'),
  variacao: z.string().optional(),
  observacoes: z.string().optional(),
  fotoUrls: z.array(z.string()).max(5).optional().default([]),
})

export const criarPedidoCompraSchema = z.object({
  itens: z.array(pedidoCompraItemSchema).min(1, 'Adicione ao menos um item'),
  observacoesCliente: z.string().optional(),
  formaPagamentoCliente: z.enum(['PIX', 'CARTAO_WHATSAPP']).optional(),
})

export const atualizarPedidoCompraAdminSchema = z.object({
  status: z.enum(['SOLICITADO', 'EM_ANALISE', 'COTACAO_DISPONIVEL', 'AGUARDANDO_CONFIRMACAO_CLIENTE', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_FEITO', 'COMPRADO', 'CANCELADO', 'AGUARDANDO_REVISAO', 'AGUARDANDO_CONFIRMACAO', 'PAGO']).optional(),
  valorTotal: z.number().nonnegative().optional().nullable(),
  moeda: z.string().min(1).optional(),
  chavePix: z.string().optional().nullable(),
  qrCodePix: z.string().optional().nullable(),
  instrucoesPix: z.string().optional().nullable(),
  linkCartao: z.string().url('Informe um link válido').optional().nullable().or(z.literal('')),
  whatsappRecepcao: z.string().optional().nullable(),
  observacoesAdmin: z.string().optional().nullable(),
  dataLimitePagamento: z.string().datetime().optional().nullable(),
  formaPagamentoCliente: z.enum(['PIX', 'CARTAO_WHATSAPP']).optional().nullable(),
  pagoEm: z.string().datetime().optional().nullable(),
  comprovanteCompraUrl: z.string().optional().nullable(),
  comprovantePagamentoUrl: z.string().optional().nullable(),
  comprovanteEnviadoEm: z.string().datetime().optional().nullable(),
  comprovanteConfirmadoEm: z.string().datetime().optional().nullable(),
})

export const pedidoConfigSchema = z.object({
  titulo: z.string().min(2).max(120).optional(),
  subtitulo: z.string().max(500).optional().nullable(),
  introducaoHtml: z.string().optional().nullable(),
  comoFuncionaHtml: z.string().optional().nullable(),
  passoAPassoHtml: z.string().optional().nullable(),
  podeNaoPodeHtml: z.string().optional().nullable(),
  etapasHtml: z.string().optional().nullable(),
  regrasHtml: z.string().optional().nullable(),
  posPedidoHtml: z.string().optional().nullable(),
  regrasAdicionaisHtml: z.string().optional().nullable(),
})

export type CriarPedidoCompraInput = z.infer<typeof criarPedidoCompraSchema>
export type AtualizarPedidoCompraAdminInput = z.infer<typeof atualizarPedidoCompraAdminSchema>
