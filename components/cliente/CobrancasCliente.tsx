'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { formatarMoeda } from '@/lib/moeda'

type CobrancaCliente = {
  id: string
  descricao: string
  valor: number
  moeda: string
  status: string
  chavePix: string | null
  copiaEColaPix: string | null
  comprovanteUrl: string | null
  criadoEm: string
  notaFiscal: { urlPdf: string | null; numero: string | null } | null
}

export function CobrancasCliente({ cobrancas }: { cobrancas: CobrancaCliente[] }) {
  const router = useRouter()
  const refs = useRef<Record<string, HTMLInputElement | null>>({})
  const [enviando, setEnviando] = useState<string | null>(null)
  const [apagando, setApagando] = useState<string | null>(null)

  async function upload(id: string, file?: File) {
    if (!file) return
    setEnviando(id)
    const form = new FormData()
    form.append('comprovante', file)
    const res = await fetch(`/api/cobrancas/${id}/comprovante`, { method: 'POST', body: form })
    setEnviando(null)
    if (res.ok) {
      toast.success('Comprovante enviado para validação')
      router.refresh()
    } else {
      toast.error((await res.json()).error ?? 'Não foi possível enviar o comprovante')
    }
  }

  async function apagar(id: string) {
    if (!confirm('Apagar este comprovante?')) return
    setApagando(id)
    const res = await fetch(`/api/cobrancas/${id}/comprovante`, { method: 'DELETE' })
    setApagando(null)
    if (res.ok) {
      toast.success('Comprovante apagado')
      router.refresh()
    } else {
      toast.error((await res.json()).error ?? 'Não foi possível apagar o comprovante')
    }
  }

  return (
    <div className="space-y-3">
      {cobrancas.map((c) => {
        const podeEditarComprovante = c.status !== 'PAGO' && !c.notaFiscal?.urlPdf
        return (
          <div key={c.id} className="bg-white border border-gray-100 rounded-lg p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium" style={{ color: '#1A1A2E' }}>{c.descricao}</p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  {new Date(c.criadoEm).toLocaleDateString('pt-BR')} | {c.status.replaceAll('_', ' ')}
                </p>
              </div>
              <p className="font-semibold" style={{ color: '#FF6B9D' }}>{formatarMoeda(c.valor, c.moeda)}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {c.copiaEColaPix && (
                <button onClick={() => navigator.clipboard.writeText(c.copiaEColaPix!)} className="px-3 py-1.5 text-xs rounded-lg" style={{ background: '#FFF1F5', color: '#FF6B9D' }}>
                  Copiar PIX
                </button>
              )}
              <input ref={el => { refs.current[c.id] = el }} className="hidden" type="file" accept="image/jpeg,image/png,application/pdf" onChange={e => upload(c.id, e.target.files?.[0])} />
              {podeEditarComprovante && (
                <button onClick={() => refs.current[c.id]?.click()} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg text-white" style={{ background: '#1A1A2E' }}>
                  <Upload className="w-3.5 h-3.5" />
                  {enviando === c.id ? 'Enviando...' : c.comprovanteUrl ? 'Substituir comprovante' : 'Enviar comprovante'}
                </button>
              )}
              {c.comprovanteUrl && <a href={c.comprovanteUrl} target="_blank" className="px-3 py-1.5 text-xs rounded-lg" style={{ background: '#F3F4F6', color: '#374151' }}>Ver comprovante</a>}
              {c.comprovanteUrl && podeEditarComprovante && (
                <button onClick={() => apagar(c.id)} disabled={apagando === c.id} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                  {apagando === c.id ? 'Apagando...' : 'Apagar comprovante'}
                </button>
              )}
              {c.notaFiscal?.urlPdf && <a href={c.notaFiscal.urlPdf} target="_blank" className="px-3 py-1.5 text-xs rounded-lg" style={{ background: '#ECFDF5', color: '#15803D' }}>Baixar nota {c.notaFiscal.numero ? `#${c.notaFiscal.numero}` : ''}</a>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
