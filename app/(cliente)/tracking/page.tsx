import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import { TrackingCliente } from '@/components/cliente/TrackingCliente'
import { GuiaArmazenamento } from '@/components/cliente/GuiaArmazenamento'

export default async function TrackingPage() {
  const session = await auth()
  if (!session?.user) return null
  const cliente = await prisma.cliente.findFirst({ where: clienteWhereFromSession(session.user) })
  if (!cliente) return null

  const [caixas, servicos] = await Promise.all([
    prisma.caixaRecebida.findMany({
      where: { clienteId: cliente.id },
      select: {
        id: true,
        tracking: true,
        lojaOrigem: true,
        observacoes: true,
        comprovanteCompraUrl: true,
        fotoEtiquetaUrl: true,
        fotoEtiquetaUrls: true,
        status: true,
        recebidoEm: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.solicitacaoServico.findMany({
      where: { clienteId: cliente.id, status: 'CONCLUIDO' },
      select: { caixaId: true, tipo: true },
    }),
  ])

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>Tracking</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>Registre suas encomendas e acompanhe quando elas chegarem ao armazém.</p>
      </div>
      <TrackingCliente caixas={caixas} servicos={servicos as never} />
      <GuiaArmazenamento />
    </div>
  )
}
