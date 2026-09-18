'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function PedidoCotacaoAcoes({ pedidoId, status, valorTotal, moeda }: { pedidoId: string; status: string; valorTotal: number | null; moeda: string }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState<'aceitar' | 'cancelar' | null>(null)

  const aguardandoResposta = status === 'COTACAO_DISPONIVEL' || status === 'AGUARDANDO_CONFIRMACAO_CLIENTE'
  if (!aguardandoResposta) return null

  async function acao(qual: 'aceitar' | 'cancelar') {
    if (qual === 'cancelar' && !confirm('Cancelar esta solicitação? Poderemos encerrar o pedido.')) return
    setCarregando(qual)
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/${qual}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível concluir')
      toast.success(qual === 'aceitar' ? 'Cotação aceita! Aguardando pagamento.' : 'Solicitação cancelada.')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar')
    } finally {
      setCarregando(null)
    }
  }

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
      <h2 className="font-semibold mb-1" style={{ color: '#1A1A2E' }}>Cotação disponível</h2>
      <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
        {valorTotal ? <>Valor cotado: <strong style={{ color: '#1A1A2E' }}>{valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {moeda}</strong></> : 'Nossa equipe preparou a cotação do seu pedido.'}
      </p>
      <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Confirme se deseja continuar com a compra. Ao aceitar, o pedido vai para Aguardando pagamento.</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => acao('aceitar')}
          disabled={carregando !== null}
          className="px-6 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}
        >
          {carregando === 'aceitar' ? 'Confirmando...' : 'Aceitar cotação'}
        </button>
        <button
          type="button"
          onClick={() => acao('cancelar')}
          disabled={carregando !== null}
          className="px-6 h-11 rounded-xl text-sm font-semibold border disabled:opacity-60 bg-white"
          style={{ borderColor: '#FECACA', color: '#DC2626' }}
        >
          {carregando === 'cancelar' ? 'Cancelando...' : 'Cancelar solicitação'}
        </button>
      </div>
    </div>
  )
}
