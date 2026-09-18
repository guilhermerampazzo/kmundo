import { prisma } from '@/lib/prisma'
import { PedidosAdminClient } from '@/components/admin/PedidosAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPedidosPage({ searchParams }: { searchParams: { status?: string; busca?: string; tab?: string } }) {
  const status = searchParams.status ?? ''
  const busca = searchParams.busca?.trim() ?? ''
  const tab = searchParams.tab ?? 'pedidos'

  const where: Record<string, unknown> = {}
  if (status) {
    if (status === 'PAGO_COMPRADO') where['status'] = { in: ['PAGAMENTO_FEITO', 'COMPRADO', 'PAGO'] }
    else where['status'] = status
  }
  if (busca) {
    const or: Record<string, unknown>[] = [{ nomeCompleto: { contains: busca, mode: 'insensitive' } }]
    const num = Number(busca.replace('#', '').replace(/^0+/, ''))
    if (!Number.isNaN(num) && busca.replace(/\D/g, '').length > 0) or.push({ numeroDeSuite: num })
    // também tenta busca sem modo insensitive fallback
    where['cliente'] = { OR: or }
  }

  const [pedidos, pedidoConfig] = await Promise.all([
    prisma.pedidoCompra.findMany({
      where,
      include: { cliente: { select: { nomeCompleto: true, numeroDeSuite: true } }, itens: true },
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.pedidoConfig.findFirst(),
  ])

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#1A1A2E' }}>Pedidos de compra</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>{pedidos.length} pedido(s) · Filtros por status e busca por nome/suíte</p>
      </div>
      <PedidosAdminClient pedidos={pedidos as never} config={pedidoConfig as never} initialTab={tab} initialBusca={busca} initialStatus={status} />
    </div>
  )
}
