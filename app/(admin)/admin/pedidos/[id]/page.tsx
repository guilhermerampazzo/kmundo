import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { PedidoCompraAdminForm } from '@/components/admin/PedidoCompraAdminForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { pedidoStatusLabel as statusLabel, pedidoStatusColors as statusColors } from '@/lib/pedido-status'

export default async function AdminPedidoDetalhePage({ params }: { params: { id: string } }) {
  const [pedido, config] = await Promise.all([
    prisma.pedidoCompra.findUnique({
      where: { id: params.id },
      include: {
        cliente: { select: { id: true, nomeCompleto: true, numeroDeSuite: true } },
        itens: true,
      },
    }),
    prisma.configuracao.findFirst(),
  ])

  if (!pedido) notFound()

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="flex flex-wrap items-start gap-3 mb-6 sm:mb-8">
        <Link href="/admin/pedidos">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0" style={{ color: '#6B7280' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold leading-tight" style={{ color: '#1A1A2E' }}>Pedido de compra</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Suite <Link href={`/admin/clientes/${pedido.cliente.id}`} className="font-mono font-bold hover:underline" style={{ color: '#FF6B9D' }}>#{String(pedido.cliente.numeroDeSuite).padStart(3, '0')}</Link> — {pedido.cliente.nomeCompleto}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DeleteButton url={`/api/pedidos/${pedido.id}`} confirmar="Tem certeza que deseja excluir este pedido?" redirectTo="/admin/pedidos" />
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white" style={{ background: statusColors[pedido.status] }}>
            {statusLabel[pedido.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Itens do pedido</h2>
          <div className="space-y-3">
            {pedido.itens.map((item) => (
              <div key={item.id} className="rounded-xl p-4" style={{ background: '#F9FAFB' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FFF1F5' }}>
                    <ShoppingBag className="w-4 h-4" style={{ color: '#FF6B9D' }} />
                  </div>
                  <div>
                    {item.urlProduto ? (
                      <a href={item.urlProduto} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline" style={{ color: '#1A1A2E' }}>{item.nomeProduto} ↗</a>
                    ) : (
                      <p className="font-medium text-sm" style={{ color: '#1A1A2E' }}>{item.nomeProduto}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Quantidade: {item.quantidade}{item.variacao ? ` · ${item.variacao}` : ''}</p>
                    {item.urlProduto && <a href={item.urlProduto} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 inline-block hover:underline" style={{ color: '#FF6B9D' }}>Abrir link do produto</a>}
                    {(item as { fotoUrls?: string[] }).fotoUrls && (item as { fotoUrls?: string[] }).fotoUrls!.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(item as { fotoUrls?: string[] }).fotoUrls!.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={item.nomeProduto} className="w-16 h-16 rounded-lg object-cover border hover:opacity-90 transition-opacity" style={{ borderColor: '#E5E7EB' }} />
                          </a>
                        ))}
                      </div>
                    )}
                    {item.observacoes && <p className="text-sm mt-2" style={{ color: '#6B7280' }}>{item.observacoes}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pedido.observacoesCliente && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>Observações da cliente</p>
              <p className="text-sm" style={{ color: '#374151' }}>{pedido.observacoesCliente}</p>
            </div>
          )}
        </div>

        <PedidoCompraAdminForm
          pedido={{
            id: pedido.id,
            status: pedido.status,
            valorTotal: pedido.valorTotal,
            moeda: pedido.moeda,
            chavePix: pedido.chavePix,
            qrCodePix: pedido.qrCodePix,
            instrucoesPix: pedido.instrucoesPix,
            linkCartao: pedido.linkCartao,
            whatsappRecepcao: pedido.whatsappRecepcao,
            observacoesAdmin: pedido.observacoesAdmin,
            dataLimitePagamento: pedido.dataLimitePagamento?.toISOString() ?? null,
            formaPagamentoCliente: pedido.formaPagamentoCliente,
            comprovanteCompraUrl: pedido.comprovanteCompraUrl ?? null,
            comprovantePagamentoUrl: pedido.comprovantePagamentoUrl ?? null,
            comprovanteEnviadoEm: pedido.comprovanteEnviadoEm?.toISOString() ?? null,
          }}
          config={config ? {
            chavePix: config.chavePix,
            qrCodePix: config.qrCodePix,
            instrucoesPix: config.instrucoesPix,
            whatsappRecepcao: config.whatsappRecepcao,
          } : null}
        />
      </div>
    </div>
  )
}
