import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Truck, Package, ChevronRight, CheckCircle, CheckCircle2, Search } from 'lucide-react'
import { EnvioConfigEditor } from '@/components/admin/EnvioConfigEditor'

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

export default async function AdminEnviosPage({ searchParams }: { searchParams: { status?: string; metodo?: string; busca?: string; tab?: string } }) {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') redirect('/login')

  const tab = searchParams.tab === 'textos' ? 'textos' : 'lista'

  if (tab === 'textos') {
    const config = await prisma.envioConfig.findFirst()
    return (
      <div className="p-4 sm:p-8 max-w-5xl">
        <div className="flex gap-2 mb-6">
          <Link href="/admin/envios" className="px-4 py-2 rounded-xl text-sm font-medium bg-white border" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Envios</Link>
          <span className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#FF6B9D,#C77DFF)' }}>Textos / Termos</span>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>Textos de Envios</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>Edite Termos de Uso, avisos, mensagens por status e painel informativo — tudo aparece instantaneamente para o cliente.</p>
        </div>
        <EnvioConfigEditor initial={config as never} />
      </div>
    )
  }

  // Agrupamento: filtros legados compartilham label/cor (PAGO=Ag. pagamento, ENTREGUE=Caixa recebida)
  const statusAgrupado: Record<string, string[]> = {
    AGUARDANDO_PAGAMENTO: ['AGUARDANDO_PAGAMENTO', 'PAGO'],
    PAGO: ['AGUARDANDO_PAGAMENTO', 'PAGO'],
    CAIXA_RECEBIDA: ['CAIXA_RECEBIDA', 'ENTREGUE'],
    ENTREGUE: ['CAIXA_RECEBIDA', 'ENTREGUE'],
  }
  const where: Record<string, unknown> = {}
  if (searchParams.status) {
    const grupo = statusAgrupado[searchParams.status]
    where['status'] = grupo ? { in: grupo } : searchParams.status
  }
  if (searchParams.metodo) where['metodoEnvio'] = searchParams.metodo
  if (searchParams.busca?.trim()) {
    const busca = searchParams.busca.trim()
    where['cliente'] = {
      OR: [
        { nomeCompleto: { contains: busca, mode: 'insensitive' } },
        ...(!Number.isNaN(Number(busca)) ? [{ numeroDeSuite: Number(busca) }] : []),
      ],
    }
  }

  const envios = await prisma.envio.findMany({
    where,
    include: {
      cliente: { select: { nomeCompleto: true, numeroDeSuite: true } },
      itens: { include: { item: { select: { descricao: true } } } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#1A1A2E' }}>Envios</h1>
          <p style={{ color: '#6B7280' }}>{envios.length} envio(s) encontrado(s)</p>
        </div>
        <Link href="/admin/envios?tab=textos" className="px-4 py-2 rounded-xl text-sm font-medium bg-white border" style={{ borderColor: '#E5E7EB', color: '#FF6B9D' }}>Editar textos</Link>
      </div>

      <form className="mb-4 flex gap-2 max-w-xl">
        <input type="hidden" name="status" value={searchParams.status ?? ''} />
        <input type="hidden" name="metodo" value={searchParams.metodo ?? ''} />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input name="busca" defaultValue={searchParams.busca ?? ''} placeholder="Buscar cliente por nome ou número da suíte" className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm" style={{ borderColor: '#E5E7EB' }} />
        </div>
        <button className="h-10 rounded-lg px-4 text-sm font-medium text-white" style={{ background: '#FF6B9D' }}>Buscar</button>
        {(searchParams.status || searchParams.metodo || searchParams.busca) && (
          <Link href="/admin/envios" className="h-10 rounded-lg px-4 text-sm font-medium inline-flex items-center border bg-white" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Limpar</Link>
        )}
      </form>
      <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap gap-2" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {[
          { label: 'Todos', value: '' },
          { label: 'Aguardando confirmação', value: 'AGUARDANDO_CONFIRMACAO' },
          { label: 'Aguardando pagamento', value: 'AGUARDANDO_PAGAMENTO' },
          { label: 'Ag. confirmação pag.', value: 'AGUARDANDO_CONFIRMACAO_PAGAMENTO' },
          { label: 'Pagamento feito', value: 'PAGAMENTO_FEITO' },
          { label: 'Confirmado', value: 'CONFIRMADO' },
          { label: 'Embalando', value: 'EMBALANDO' },
          { label: 'Enviado', value: 'ENVIADO' },
          { label: 'Caixa recebida', value: 'CAIXA_RECEBIDA' },
        ].map(({ label, value }) => {
          // Ativo considera aliases legados (PAGO/ENTREGUE)
          const statusAtivo = searchParams.status ?? ''
          const ativo = value === '' ? statusAtivo === '' : statusAtivo === value || (value === 'AGUARDANDO_PAGAMENTO' && statusAtivo === 'PAGO') || (value === 'CAIXA_RECEBIDA' && statusAtivo === 'ENTREGUE')
          return (
            <Link
              key={value}
              href={`/admin/envios?${new URLSearchParams({ ...(value ? { status: value } : {}), ...(searchParams.metodo ? { metodo: searchParams.metodo } : {}), ...(searchParams.busca ? { busca: searchParams.busca } : {}) })}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: ativo ? '#FF6B9D' : '#F3F4F6', color: ativo ? 'white' : '#6B7280' }}
            >
              {label}
            </Link>
          )
        })}
        <div className="w-px bg-gray-200 self-stretch mx-1" />
        {[
          { label: 'FedEx', value: 'FEDEX' },
          { label: 'EMS', value: 'EMS' },
          { label: 'Grupo', value: 'ENVIO_EM_GRUPO' },
        ].map(({ label, value }) => {
          const ativo = searchParams.metodo === value
          return (
            <Link
              key={value}
              href={`/admin/envios?${new URLSearchParams({ metodo: value, ...(searchParams.status ? { status: searchParams.status } : {}), ...(searchParams.busca ? { busca: searchParams.busca } : {}) })}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: ativo ? '#C77DFF' : '#F3F4F6', color: ativo ? 'white' : '#6B7280' }}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Truck className="w-12 h-12" style={{ color: '#E5E7EB' }} />
          <p className="font-medium" style={{ color: '#1A1A2E' }}>Nenhum envio encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {envios.map(envio => (
            <Link key={envio.id} href={`/admin/envios/${envio.id}`}>
              <div className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFF1F5' }}>
                  <Package className="w-5 h-5" style={{ color: '#FF6B9D' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" style={{ color: '#1A1A2E' }}>
                      Suite #{String(envio.cliente.numeroDeSuite).padStart(3, '0')} — {envio.cliente.nomeCompleto}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: statusColors[envio.status] ?? '#6B7280' }}>
                      {statusLabel[envio.status] ?? envio.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                      {metodoLabel[envio.metodoEnvio]}
                    </span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      {envio.itens.length} {envio.itens.length === 1 ? 'item' : 'itens'}
                    </span>
                    {(envio as { comprovanteFreteUrl?: string | null }).comprovanteFreteUrl && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#F97316' }}>
                        <CheckCircle className="w-3 h-3" />
                        Comprovante
                      </span>
                    )}
                    {(envio as { caixaRecebidaEm?: Date | null }).caixaRecebidaEm && (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#22C55E' }}>
                        <CheckCircle2 className="w-3 h-3" />
                        Caixa recebida
                      </span>
                    )}
                    <span className="text-xs" style={{ color: '#D1D5DB' }}>
                      {new Date(envio.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#D1D5DB' }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
