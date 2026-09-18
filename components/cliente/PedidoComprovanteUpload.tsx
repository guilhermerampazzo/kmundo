'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react'

export function PedidoComprovanteUpload({ pedidoId, status, comprovantePagamentoUrl }: { pedidoId: string; status: string; comprovantePagamentoUrl: string | null }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('tipo', 'pagamento')
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/comprovante`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao enviar')
      toast.success(json.message ?? 'Comprovante recebido! Aguarde a verificação.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar comprovante')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (status === 'CANCELADO' || status === 'COMPRADO') {
    if (!comprovantePagamentoUrl) return null
  }

  const jaEnviou = !!comprovantePagamentoUrl
  const pagamentoFeito = status === 'PAGAMENTO_FEITO'

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#1A1A2E' }}>
        <Upload className="w-4 h-4" style={{ color: '#FF6B9D' }} />
        Comprovante de pagamento
      </h3>

      {jaEnviou && (
        <div className="mb-4 rounded-xl p-3 flex items-start gap-2" style={{ background: pagamentoFeito ? '#FFF7ED' : '#F0FDF4', border: `1px solid ${pagamentoFeito ? '#FFE4B5' : '#BBF7D0'}` }}>
          {pagamentoFeito ? <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: '#F97316' }} /> : <CheckCircle className="w-4 h-4 mt-0.5" style={{ color: '#22C55E' }} />}
          <div className="text-sm">
            <p className="font-medium" style={{ color: pagamentoFeito ? '#9A3412' : '#166534' }}>
              {pagamentoFeito ? 'Comprovante recebido — pagamento feito' : 'Pagamento confirmado!'}
            </p>
            <p style={{ color: '#6B7280' }} className="text-xs mt-1">
              {pagamentoFeito ? 'Recebemos seu comprovante. Vamos verificar o pagamento e confirmar assim que o valor cair. Aguarde, por favor.' : 'Seu pagamento foi confirmado pela equipe.'}
            </p>
            <a href={comprovantePagamentoUrl!} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline mt-1 inline-block" style={{ color: '#FF6B9D' }}>Ver comprovante enviado</a>
          </div>
        </div>
      )}

      {(!jaEnviou || pagamentoFeito) && status !== 'COMPRADO' ? (
        <div>
          <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
            Anexe o comprovante (imagem ou PDF, até 10MB) direto aqui — não precisa enviar por WhatsApp. Ao enviar, o pedido muda automaticamente para <strong>Pagamento feito</strong>.
          </p>
          <label className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-semibold cursor-pointer text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg,#FF6B9D,#FF4D8D)' }}>
            <Upload className="w-4 h-4" />
            {uploading ? 'Enviando...' : jaEnviou ? 'Reenviar comprovante' : 'Enviar comprovante'}
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        </div>
      ) : null}
    </div>
  )
}
