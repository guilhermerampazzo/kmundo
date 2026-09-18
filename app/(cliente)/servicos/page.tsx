import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import { ServicosCliente } from '@/components/cliente/ServicosCliente'

export default async function ServicosPage() {
  const session = await auth()
  const cliente = await prisma.cliente.findFirst({ where: clienteWhereFromSession(session!.user!) })
  if (!cliente) return null

  const [caixas, servicos, config, cobrancasPendentes] = await Promise.all([
    prisma.caixaRecebida.findMany({ where: { clienteId: cliente.id }, select: { id: true, tracking: true, lojaOrigem: true, status: true }, orderBy: { criadoEm: 'desc' } }),
    prisma.solicitacaoServico.findMany({ where: { clienteId: cliente.id }, include: { caixa: { select: { tracking: true } } }, orderBy: { criadoEm: 'desc' } }),
    prisma.configuracao.findFirst(),
    prisma.cobranca.findMany({ where: { clienteId: cliente.id, solicitacaoId: { not: null }, status: { in: ['PENDENTE', 'COMPROVANTE_ENVIADO'] } }, select: { valor: true, moeda: true } }),
  ])

  const precos = {
    UNBOXING: config?.precoUnboxing ?? 0,
    FOTO_VIDEO: config?.precoFotoVideo ?? 0,
    MEDICAO: config?.precoMedicao ?? 0,
    REEMBALAGEM: config?.precoReembalagem ?? 0,
    OUTRO: config?.precoOutro ?? 0,
    moeda: config?.moedaTaxa ?? 'USD',
  }

  const totalPendente = cobrancasPendentes.reduce((s, c) => s + c.valor, 0)
  const moedaTotal = cobrancasPendentes[0]?.moeda ?? precos.moeda

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>Serviços</h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>Foto/vídeo, peso e tamanho vinculados ao rastreamento.</p>
      </div>
      <ServicosCliente caixas={caixas} servicos={servicos} precos={precos} totalPendente={totalPendente} moedaTotal={moedaTotal} />
    </div>
  )
}
