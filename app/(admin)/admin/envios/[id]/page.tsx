import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, CheckCircle } from 'lucide-react' // Package usado no título do card
import { EnvioAdminForm } from '@/components/admin/EnvioAdminForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { ItemEnvioCard } from '@/components/admin/ItemEnvioCard'

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

export default async function AdminEnvioDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') redirect('/login')

  const envio = await prisma.envio.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, nomeCompleto: true, numeroDeSuite: true } },
      itens: {
        include: {
          item: { select: { id: true, descricao: true, lojaOrigem: true, trackingLoja: true, status: true, fotos: true, observacoes: true, dataEntrada: true } },
        },
      },
      caixas: {
        include: {
          caixa: { select: { id: true, tracking: true, lojaOrigem: true, status: true, comprovanteCompraUrl: true, fotoEtiquetaUrl: true } },
        },
      },
    },
  })

  if (!envio) notFound()

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="flex flex-wrap items-start gap-3 mb-6 sm:mb-8">
        <Link href="/admin/envios">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0" style={{ color: '#6B7280' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold leading-tight" style={{ color: '#1A1A2E' }}>
            Envio — {metodoLabel[envio.metodoEnvio]}
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Suite{' '}
            <Link href={`/admin/clientes/${envio.cliente.id}`} className="font-mono font-bold hover:underline" style={{ color: '#FF6B9D' }}>
              #{String(envio.cliente.numeroDeSuite).padStart(3, '0')}
            </Link>
            {' '}— {envio.cliente.nomeCompleto}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DeleteButton
            url={`/api/envios/${envio.id}`}
            confirmar="Tem certeza que deseja excluir este envio? Esta ação não pode ser desfeita."
            redirectTo="/admin/envios"
          />
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ background: statusColors[envio.status] }}
          >
            {statusLabel[envio.status]}
          </span>
          {envio.confirmadoCliente && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{ background: '#F0FDF4', color: '#16A34A' }}
            >
              <CheckCircle className="w-3 h-3" />
              Cliente confirmou
            </span>
          )}
        </div>
      </div>

      {/* Itens — full width */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1A2E' }}>
          <Package className="w-4 h-4" style={{ color: '#FF6B9D' }} />
          Itens no Envio ({envio.itens.length})
        </h2>
        {envio.itens.length === 0 ? (
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Nenhum item — envio só com caixas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {envio.itens.map(({ item }) => (
              <ItemEnvioCard
                key={item.id}
                item={{
                  id: item.id,
                  descricao: item.descricao,
                  lojaOrigem: item.lojaOrigem,
                  trackingLoja: item.trackingLoja,
                  status: item.status,
                  fotos: item.fotos,
                  observacoes: item.observacoes,
                  dataEntrada: item.dataEntrada.toISOString(),
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Caixas — full width */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1A2E' }}>
          <Package className="w-4 h-4" style={{ color: '#C77DFF' }} />
          Caixas no Envio ({envio.caixas.length})
        </h2>
        {envio.caixas.length === 0 ? (
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Nenhuma caixa — envio só com itens.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {envio.caixas.map(({ caixa }) => (
              <div key={caixa.id} className="rounded-xl p-4" style={{ background: '#F9FAFB' }}>
                <p className="font-mono font-medium text-sm" style={{ color: '#1A1A2E' }}>{caixa.tracking}</p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{caixa.lojaOrigem ?? '—'} · {caixa.status}</p>
                <div className="mt-2 flex gap-2">
                  <a href={caixa.comprovanteCompraUrl} target="_blank" rel="noreferrer" className="text-xs hover:underline" style={{ color: '#FF6B9D' }}>Comprovante</a>
                  {caixa.fotoEtiquetaUrl && <a href={caixa.fotoEtiquetaUrl} target="_blank" rel="noreferrer" className="text-xs hover:underline" style={{ color: '#FF6B9D' }}>Etiqueta</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dados novos da reforma */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Dados do cliente</h2>
        <div className="space-y-3 text-sm">
          {envio.valorDeclaradoTexto && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Valor declarado / Declaração</p><p className="whitespace-pre-wrap mt-1" style={{ color: '#1A1A2E' }}>{envio.valorDeclaradoTexto}</p></div>}
          {envio.enderecoCompleto && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Endereço completo</p><p className="whitespace-pre-wrap mt-1" style={{ color: '#1A1A2E' }}>{envio.enderecoCompleto}</p></div>}
          {envio.usarEnderecoCoreano && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Endereço coreano</p><p className="whitespace-pre-wrap mt-1" style={{ color: '#1A1A2E' }}>{envio.enderecoCoreano} — Tel: {envio.telefoneCoreano}</p></div>}
          <p className="text-xs" style={{ color: envio.aceitouTermos ? '#22C55E' : '#EF4444' }}>{envio.aceitouTermos ? '✓ Aceitou Termos em ' + (envio.aceitouTermosEm ? new Date(envio.aceitouTermosEm).toLocaleString('pt-BR') : '') : '✗ Não aceitou termos'}</p>
          {envio.comprovanteFreteUrl && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Comprovante frete</p><a href={envio.comprovanteFreteUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline" style={{ color: '#FF6B9D' }}>Ver comprovante</a> {envio.comprovanteFreteEnviadoEm && <span className="text-xs" style={{ color: '#9CA3AF' }}> — {new Date(envio.comprovanteFreteEnviadoEm).toLocaleString('pt-BR')}</span>}</div>}
          {envio.fotosRecebimento.length > 0 && <div><p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>Fotos recebimento ({envio.fotosRecebimento.length})</p><div className="grid grid-cols-3 gap-2">{envio.fotosRecebimento.map((f: string, i: number) => <a key={i} href={f} target="_blank" rel="noopener noreferrer"><img src={f} alt={`recebimento ${i}`} className="w-full aspect-square object-cover rounded-lg" /></a>)}</div></div>}
          {envio.caixaRecebidaEm && <p className="text-xs font-medium" style={{ color: '#22C55E' }}>Caixa recebida em {new Date(envio.caixaRecebidaEm).toLocaleString('pt-BR')}</p>}
        </div>
      </div>

      {/* Formulário + Fotos em 2 colunas */}
      <EnvioAdminForm
        envio={{
          id: envio.id,
          status: envio.status,
          metodoEnvio: envio.metodoEnvio,
          peso: envio.peso,
          largura: envio.largura,
          altura: envio.altura,
          comprimento: envio.comprimento,
          valorDeclarado: envio.valorDeclarado,
          moeda: envio.moeda,
          valorFrete: (envio as { valorFrete?: number | null }).valorFrete ?? null,
          moedaFrete: (envio as { moedaFrete?: string | null }).moedaFrete ?? null,
          videoUrl: envio.videoUrl,
          trackingEnvio: envio.trackingEnvio,
          dataLimitePagamento: envio.dataLimitePagamento?.toISOString() ?? null,
          observacoes: envio.observacoes,
          declaracaoConteudo: envio.declaracaoConteudo,
          fretePago: (envio as { fretePago?: boolean }).fretePago ?? false,
        }}
        fotos={envio.fotos}
      />
    </div>
  )
}
