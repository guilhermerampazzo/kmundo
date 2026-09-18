import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import Link from 'next/link'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { pedidoStatusLabel, pedidoStatusColors, pedidoStatusTabs } from '@/lib/pedido-status'

export const dynamic = 'force-dynamic'

const statusLabel = pedidoStatusLabel
const statusColors = pedidoStatusColors

const tabs = pedidoStatusTabs

export default async function MeusPedidosPage({ searchParams }: { searchParams: { status?: string } }) {
  const session = await auth()
  const cliente = await prisma.cliente.findFirst({ where: clienteWhereFromSession(session!.user!) })
  if (!cliente) return null

  const status = searchParams.status ?? ''
  const where: Record<string, unknown> = { clienteId: cliente.id }
  if (status) {
    if (status === 'PAGO_COMPRADO') where['status'] = { in: ['PAGAMENTO_FEITO', 'COMPRADO', 'PAGO'] }
    else where['status'] = status
  }

  const [pedidos, pedidoConfig] = await Promise.all([
    prisma.pedidoCompra.findMany({ where, include: { itens: true }, orderBy: { criadoEm: 'desc' } }),
    prisma.pedidoConfig.findFirst(),
  ])

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#1A1A2E' }}>{pedidoConfig?.titulo ?? 'Meus Pedidos'}</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>{pedidoConfig?.subtitulo ?? `${pedidos.length} pedido(s)`}</p>
        </div>
        <Link href="/meus-pedidos/novo" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF4D8D)' }}>
          Novo pedido
        </Link>
      </div>

      {pedidoConfig?.introducaoHtml && (
        <div className="bg-white rounded-2xl p-5 mb-6 termos-content" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: pedidoConfig.introducaoHtml }} />
      )}

      <div className="bg-white rounded-2xl p-3 flex flex-wrap gap-2 mb-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {tabs.map(t => {
          const ativo = status === t.value
          return (
            <Link key={t.value} href={`/meus-pedidos?${t.value ? `status=${t.value}` : ''}`} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: ativo ? '#FF6B9D' : '#F3F4F6', color: ativo ? 'white' : '#6B7280' }}>
              {t.label}
            </Link>
          )
        })}
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: '#E5E7EB' }} />
          <p className="font-medium" style={{ color: '#1A1A2E' }}>Nenhum pedido encontrado</p>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Tente outro filtro ou crie um novo pedido.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map(pedido => (
            <Link key={pedido.id} href={`/meus-pedidos/${pedido.id}`}>
              <div className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFF1F5' }}>
                  <ShoppingBag className="w-5 h-5" style={{ color: '#FF6B9D' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm" style={{ color: '#1A1A2E' }}>Pedido com {pedido.itens.length} item(ns)</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: statusColors[pedido.status] ?? '#6B7280' }}>
                      {statusLabel[pedido.status] ?? pedido.status}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>Criado em {new Date(pedido.criadoEm).toLocaleDateString('pt-BR')}</div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#D1D5DB' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {(pedidoConfig?.etapasHtml || pedidoConfig?.regrasHtml) && (
        <div className="mt-8 space-y-4">
          {[
            { html: pedidoConfig.podeNaoPodeHtml, titulo: 'O que pode / não pode' },
            { html: pedidoConfig.etapasHtml, titulo: 'Etapas do pedido' },
            { html: pedidoConfig.regrasHtml, titulo: 'Regras importantes' },
            { html: pedidoConfig.posPedidoHtml, titulo: 'Depois do pedido' },
            { html: pedidoConfig.regrasAdicionaisHtml, titulo: 'Outras informações' },
          ].map((s, i) => s.html ? (
            <details key={i} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <summary className="list-none flex items-center justify-between p-5 cursor-pointer">
                <h3 className="font-semibold" style={{ color: '#1A1A2E' }}>{s.titulo}</h3>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: '#FFF1F5', color: '#FF6B9D' }}>+</span>
              </summary>
              <div className="px-5 pb-5 termos-content" dangerouslySetInnerHTML={{ __html: s.html }} />
            </details>
          ) : null)}
        </div>
      )}
    </div>
  )
}
