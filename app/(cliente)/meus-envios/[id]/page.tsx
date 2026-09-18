import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Truck, Calendar, MessageSquare } from 'lucide-react'
import { CobrancasCliente } from '@/components/cliente/CobrancasCliente'
import { EnvioComprovanteFrete } from '@/components/cliente/EnvioComprovanteFrete'
import { EnvioCaixaRecebida } from '@/components/cliente/EnvioCaixaRecebida'

export const dynamic = 'force-dynamic'

const statusLabel: Record<string, string> = {
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmação',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  AGUARDANDO_CONFIRMACAO_PAGAMENTO: 'Aguardando confirmação do pagamento',
  PAGAMENTO_FEITO: 'Pagamento feito',
  CONFIRMADO: 'Confirmado',
  EMBALANDO: 'Embalando',
  PAGO: 'Aguardando pagamento',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Caixa recebida',
  CAIXA_RECEBIDA: 'Caixa recebida',
}
const statusColors: Record<string, string> = {
  AGUARDANDO_CONFIRMACAO: '#F59E0B',
  AGUARDANDO_PAGAMENTO: '#8B5CF6',
  AGUARDANDO_CONFIRMACAO_PAGAMENTO: '#F97316',
  PAGAMENTO_FEITO: '#22C55E',
  CONFIRMADO: '#3B82F6',
  EMBALANDO: '#F97316',
  PAGO: '#8B5CF6',
  ENVIADO: '#FF6B9D',
  ENTREGUE: '#22C55E',
  CAIXA_RECEBIDA: '#22C55E',
}
const metodoLabel: Record<string, string> = {
  FEDEX: 'FedEx',
  EMS: 'EMS',
  ENVIO_EM_GRUPO: 'Envio em Grupo',
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}`
  } catch {}
  return null
}

export default async function EnvioDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth()
  const cliente = await prisma.cliente.findFirst({ where: clienteWhereFromSession(session!.user!) })
  if (!cliente) notFound()

  const [envio, envioConfig] = await Promise.all([
    prisma.envio.findFirst({
      where: { id: params.id, clienteId: cliente.id },
      include: { itens: { include: { item: { select: { id: true, descricao: true, lojaOrigem: true, trackingLoja: true } } } }, caixas: { include: { caixa: { select: { id: true, tracking: true, lojaOrigem: true, status: true } } } }, cobrancas: { include: { notaFiscal: true }, orderBy: { criadoEm: 'desc' } } },
    }),
    prisma.envioConfig.findFirst(),
  ])

  if (!envio) notFound()

  const embedUrl = envio.videoUrl ? getYouTubeEmbedUrl(envio.videoUrl) : null

  const painelPorStatus: Record<string, string | null | undefined> = {
    AGUARDANDO_CONFIRMACAO: envioConfig?.statusAguardandoConfirmacaoHtml,
    AGUARDANDO_PAGAMENTO: envioConfig?.statusAguardandoPagamentoHtml,
    AGUARDANDO_CONFIRMACAO_PAGAMENTO: envioConfig?.statusAguardandoConfirmacaoPagamentoHtml,
    PAGAMENTO_FEITO: envioConfig?.statusPagamentoFeitoHtml,
    ENVIADO: envioConfig?.statusEnviadoHtml,
    CAIXA_RECEBIDA: envioConfig?.statusCaixaRecebidaHtml,
    ENTREGUE: envioConfig?.statusCaixaRecebidaHtml,
  }

  const painelHtml = painelPorStatus[envio.status] ?? null

  const tituloConfig = envioConfig?.titulo?.trim() || null
  const subtituloConfig = envioConfig?.subtitulo?.trim() || null

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link href="/meus-envios" className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-70" style={{ color: '#FF6B9D' }}>
        <ArrowLeft className="w-4 h-4" />Voltar para meus envios
      </Link>

      {(tituloConfig || subtituloConfig) && (
        <div className="mb-6">
          {tituloConfig && <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>{tituloConfig}</h1>}
          {subtituloConfig && <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{subtituloConfig}</p>}
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1A1A2E' }}>Envio via {metodoLabel[envio.metodoEnvio]}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: statusColors[envio.status] ?? '#6B7280' }}>{statusLabel[envio.status] ?? envio.status}</span>
          </div>
        </div>
      </div>

      {envioConfig?.introducaoHtml?.trim() && (
        <div className="bg-white rounded-2xl p-6 mb-5 termos-content" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #FF6B9D' }} dangerouslySetInnerHTML={{ __html: envioConfig.introducaoHtml }} />
      )}

      {/* Painel informativo por status */}
      {painelHtml && (
        <div className="bg-white rounded-2xl p-6 mb-5 termos-content" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #FF6B9D' }} dangerouslySetInnerHTML={{ __html: painelHtml }} />
      )}
      {envioConfig?.painelInfoHtml && !painelHtml && (
        <div className="bg-white rounded-2xl p-6 mb-5 termos-content" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: envioConfig.painelInfoHtml }} />
      )}

      {/* Comprovante frete */}
      <EnvioComprovanteFrete envioId={envio.id} status={envio.status} comprovanteFreteUrl={envio.comprovanteFreteUrl ?? null} />

      {/* Caixa recebida */}
      <EnvioCaixaRecebida envioId={envio.id} status={envio.status} />

      {/* Detalhes */}
      {envio.cobrancas.length > 0 && (
        <div className="mb-5"><CobrancasCliente cobrancas={envio.cobrancas.map(c => ({ ...c, criadoEm: c.criadoEm.toISOString() }))} /></div>
      )}

      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#6B7280' }}>DETALHES DO ENVIO</h2>
        <div className="grid grid-cols-2 gap-4">
          {envio.trackingEnvio && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Rastreamento</p><p className="text-sm font-mono font-medium mt-0.5" style={{ color: '#1A1A2E' }}>{envio.trackingEnvio}</p></div>}
          {envio.peso && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Peso</p><p className="text-sm font-medium mt-0.5" style={{ color: '#1A1A2E' }}>{envio.peso} kg</p></div>}
          {(envio.largura && envio.altura && envio.comprimento) && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Dimensões (L×A×C)</p><p className="text-sm font-medium mt-0.5" style={{ color: '#1A1A2E' }}>{envio.largura} × {envio.altura} × {envio.comprimento} cm</p></div>}
          {envio.valorDeclaradoTexto && <div className="col-span-2"><p className="text-xs" style={{ color: '#9CA3AF' }}>Valor declarado / Declaração</p><p className="text-sm mt-0.5 whitespace-pre-wrap" style={{ color: '#1A1A2E' }}>{envio.valorDeclaradoTexto}</p></div>}
          {envio.valorDeclarado && !envio.valorDeclaradoTexto && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Valor Declarado</p><p className="text-sm font-medium mt-0.5" style={{ color: '#1A1A2E' }}>{envio.valorDeclarado.toLocaleString('pt-BR')} {envio.moeda ?? 'BRL'}</p></div>}
          {envio.valorFrete && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Valor do Frete</p><p className="text-sm font-bold mt-0.5" style={{ color: '#FF6B9D' }}>{envio.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {envio.moedaFrete ?? 'BRL'}</p></div>}
          {envio.dataLimitePagamento && <div className="flex items-start gap-2"><Calendar className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#EF4444' }} /><div><p className="text-xs" style={{ color: '#9CA3AF' }}>Data limite de pagamento</p><p className="text-sm font-medium mt-0.5" style={{ color: '#EF4444' }}>{new Date(envio.dataLimitePagamento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div></div>}
          {envio.enderecoCompleto && <div className="col-span-2"><p className="text-xs" style={{ color: '#9CA3AF' }}>Endereço completo</p><p className="text-sm mt-0.5 whitespace-pre-wrap" style={{ color: '#1A1A2E' }}>{envio.enderecoCompleto}</p></div>}
          {envio.usarEnderecoCoreano && envio.enderecoCoreano && <div className="col-span-2"><p className="text-xs" style={{ color: '#9CA3AF' }}>Endereço coreano</p><p className="text-sm mt-0.5 whitespace-pre-wrap" style={{ color: '#1A1A2E' }}>{envio.enderecoCoreano} — Tel: {envio.telefoneCoreano}</p></div>}
          {envio.comprovanteFreteUrl && <div className="col-span-2"><p className="text-xs" style={{ color: '#9CA3AF' }}>Comprovante frete</p><a href={envio.comprovanteFreteUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline" style={{ color: '#FF6B9D' }}>Ver comprovante</a></div>}
          {envio.caixaRecebidaEm && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Caixa recebida em</p><p className="text-sm font-medium mt-0.5" style={{ color: '#22C55E' }}>{new Date(envio.caixaRecebidaEm).toLocaleString('pt-BR')}</p></div>}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#6B7280' }}>ITENS ({envio.itens.length})</h2>
        <div className="space-y-3">
          {envio.itens.map(({ item }) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FFF1F5' }}><Package className="w-4 h-4" style={{ color: '#FF6B9D' }} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#1A1A2E' }}>{item.descricao}</p>
                {item.lojaOrigem && <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.lojaOrigem}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#6B7280' }}>CAIXAS ({envio.caixas.length})</h2>
        {envio.caixas.length === 0 ? (
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Nenhuma caixa vinculada.</p>
        ) : (
          <div className="space-y-3">
            {envio.caixas.map(({ caixa }) => (
              <div key={caixa.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F3E8FF' }}><Package className="w-4 h-4" style={{ color: '#C77DFF' }} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate font-mono" style={{ color: '#1A1A2E' }}>{caixa.tracking}</p>
                  {caixa.lojaOrigem && <p className="text-xs" style={{ color: '#9CA3AF' }}>{caixa.lojaOrigem} · {caixa.status}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {envio.observacoes && (
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#6B7280' }}>OBSERVAÇÕES</h2>
          <div className="flex gap-3"><MessageSquare className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#9CA3AF' }} /><p className="text-sm" style={{ color: '#374151' }}>{envio.observacoes}</p></div>
        </div>
      )}

      {envio.fotos.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#6B7280' }}>FOTOS DA CAIXA ({envio.fotos.length})</h2>
          <div className="grid grid-cols-3 gap-3">
            {envio.fotos.map((foto, idx) => (
              <a key={idx} href={foto} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt={`Foto ${idx + 1}`} className="w-full aspect-square object-cover rounded-xl hover:opacity-90" />
              </a>
            ))}
          </div>
        </div>
      )}

      {envio.fotosRecebimento.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#6B7280' }}>FOTOS DE RECEBIMENTO ({envio.fotosRecebimento.length})</h2>
          <div className="grid grid-cols-3 gap-3">
            {envio.fotosRecebimento.map((foto, idx) => (
              <a key={idx} href={foto} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt={`Recebimento ${idx + 1}`} className="w-full aspect-square object-cover rounded-xl" />
              </a>
            ))}
          </div>
        </div>
      )}

      {embedUrl && (
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#6B7280' }}><Truck className="w-4 h-4" /> VÍDEO DO ENVIO</h2>
          <div className="aspect-video rounded-xl overflow-hidden"><iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
        </div>
      )}

      {(envioConfig?.prazosHtml?.trim() || envioConfig?.pagamentoHtml?.trim() || envioConfig?.comprovanteHtml?.trim() || envioConfig?.envioHtml?.trim() || envioConfig?.recebimentoHtml?.trim() || envioConfig?.regrasAdicionaisHtml?.trim() || envioConfig?.termosUsoHtml?.trim()) && (
        <div className="space-y-3 mt-2">
          {envioConfig?.prazosHtml?.trim() && <div className="bg-white rounded-2xl p-6 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: envioConfig.prazosHtml }} />}
          {envioConfig?.pagamentoHtml?.trim() && <div className="bg-white rounded-2xl p-6 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: envioConfig.pagamentoHtml }} />}
          {envioConfig?.comprovanteHtml?.trim() && <div className="bg-white rounded-2xl p-6 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: envioConfig.comprovanteHtml }} />}
          {envioConfig?.envioHtml?.trim() && <div className="bg-white rounded-2xl p-6 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: envioConfig.envioHtml }} />}
          {envioConfig?.recebimentoHtml?.trim() && <div className="bg-white rounded-2xl p-6 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: envioConfig.recebimentoHtml }} />}
          {envioConfig?.regrasAdicionaisHtml?.trim() && <div className="bg-white rounded-2xl p-6 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: envioConfig.regrasAdicionaisHtml }} />}
          {envioConfig?.termosUsoHtml?.trim() && <div className="bg-white rounded-2xl p-6 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: envioConfig.termosUsoHtml }} />}
        </div>
      )}
    </div>
  )
}
