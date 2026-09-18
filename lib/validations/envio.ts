import { z } from 'zod'

export const criarEnvioSchema = z.object({
  metodoEnvio: z.enum(['FEDEX', 'EMS', 'ENVIO_EM_GRUPO']),
  itemIds: z.array(z.string().cuid()).optional().default([]),
  caixaIds: z.array(z.string().cuid()).optional().default([]),
  valorDeclaradoTexto: z.string().max(2000).optional().nullable(),
  enderecoCompleto: z.string().min(10, 'Endereço completo é obrigatório').max(2000),
  usarEnderecoCoreano: z.boolean().default(false),
  enderecoCoreano: z.string().max(2000).optional().nullable(),
  telefoneCoreano: z.string().max(30).optional().nullable(),
  aceitouTermos: z.boolean().refine(v => v === true, { message: 'Você deve aceitar os Termos de Uso' }),
}).superRefine((data, ctx) => {
  const isGrupo = data.metodoEnvio === 'ENVIO_EM_GRUPO'
  if ((data.itemIds?.length ?? 0) + (data.caixaIds?.length ?? 0) === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['itemIds'], message: 'Selecione ao menos um item ou uma caixa' })
  }
  if (!isGrupo) {
    if (!data.valorDeclaradoTexto || data.valorDeclaradoTexto.trim().length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['valorDeclaradoTexto'], message: 'Informe Nome do item + valor em dólar (ex: Álbum BTS — US$ 25)' })
    }
  }
  if (data.usarEnderecoCoreano) {
    if (!data.enderecoCoreano || data.enderecoCoreano.trim().length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['enderecoCoreano'], message: 'Informe o endereço completo em coreano' })
    }
    if (!data.telefoneCoreano || data.telefoneCoreano.trim().length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['telefoneCoreano'], message: 'Informe o telefone do responsável' })
    }
  }
})

export const atualizarEnvioAdminSchema = z.object({
  status: z.enum(['AGUARDANDO_CONFIRMACAO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_CONFIRMACAO_PAGAMENTO', 'PAGAMENTO_FEITO', 'CONFIRMADO', 'EMBALANDO', 'PAGO', 'ENVIADO', 'ENTREGUE', 'CAIXA_RECEBIDA']).optional(),
  peso: z.number().min(0).optional().nullable(),
  largura: z.number().min(0).optional().nullable(),
  altura: z.number().min(0).optional().nullable(),
  comprimento: z.number().min(0).optional().nullable(),
  valorDeclarado: z.number().min(0).optional().nullable(),
  valorDeclaradoTexto: z.string().max(2000).optional().nullable(),
  moeda: z.string().optional().nullable(),
  valorFrete: z.number().min(0).optional().nullable(),
  moedaFrete: z.string().optional().nullable(),
  trackingEnvio: z.string().optional().nullable(),
  dataLimitePagamento: z.string().datetime().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  declaracaoConteudo: z.string().optional().nullable(),
  enderecoCompleto: z.string().max(2000).optional().nullable(),
  usarEnderecoCoreano: z.boolean().optional(),
  enderecoCoreano: z.string().max(2000).optional().nullable(),
  telefoneCoreano: z.string().max(30).optional().nullable(),
  fotos: z.array(z.string()).optional(),
  videoUrl: z.string().optional().nullable(),
})

export const envioConfigSchema = z.object({
  titulo: z.string().max(120).optional(),
  subtitulo: z.string().max(500).optional().nullable(),
  introducaoHtml: z.string().optional().nullable(),
  termosUsoHtml: z.string().optional().nullable(),
  avisoValorDeclaradoHtml: z.string().optional().nullable(),
  avisoEnderecoHtml: z.string().optional().nullable(),
  avisoEnderecoCoreanoHtml: z.string().optional().nullable(),
  painelInfoHtml: z.string().optional().nullable(),
  statusAguardandoConfirmacaoHtml: z.string().optional().nullable(),
  statusAguardandoPagamentoHtml: z.string().optional().nullable(),
  statusAguardandoConfirmacaoPagamentoHtml: z.string().optional().nullable(),
  statusPagamentoFeitoHtml: z.string().optional().nullable(),
  statusEnviadoHtml: z.string().optional().nullable(),
  statusCaixaRecebidaHtml: z.string().optional().nullable(),
  prazosHtml: z.string().optional().nullable(),
  pagamentoHtml: z.string().optional().nullable(),
  comprovanteHtml: z.string().optional().nullable(),
  envioHtml: z.string().optional().nullable(),
  recebimentoHtml: z.string().optional().nullable(),
  regrasAdicionaisHtml: z.string().optional().nullable(),
})
