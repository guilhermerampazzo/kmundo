'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PackageSearch, Upload, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

type Caixa = {
  id: string
  tracking: string
  lojaOrigem: string | null
  observacoes: string | null
  comprovanteCompraUrl: string
  fotoEtiquetaUrl: string | null
  fotoEtiquetaUrls?: string[]
  status: 'PENDENTE' | 'RECEBIDA'
  recebidoEm: Date | string | null
  criadoEm: Date | string
}
type ServicoRef = { caixaId: string | null; tipo: string }

const servicoMeta: Record<string, { label: string; color: string; legend: string }> = {
  UNBOXING: { label: 'Unboxing', color: '#22C55E', legend: 'Complete "Unboxing Image"' },
  FOTO_VIDEO: { label: 'Foto/Vídeo', color: '#EF4444', legend: 'Complete "Unboxing Video"' },
  FOTO: { label: 'Foto', color: '#EF4444', legend: 'Complete "Foto"' },
  VIDEO: { label: 'Vídeo', color: '#F97316', legend: 'Complete "Vídeo"' },
  MEDICAO: { label: 'Peso/Tamanho', color: '#3B82F6', legend: 'Complete "Inclusions"' },
  REEMBALAGEM: { label: 'Reembalagem', color: '#EAB308', legend: 'Complete "Open Package"' },
}
const ordemTipos = ['FOTO', 'VIDEO', 'MEDICAO', 'REEMBALAGEM'] as const

export function TrackingCliente({ caixas, servicos = [] }: { caixas: Caixa[]; servicos?: ServicoRef[] }) {
  const concluidosByCaixa = new Map<string, Set<string>>()
  for (const s of servicos) {
    if (!s.caixaId) continue
    if (!concluidosByCaixa.has(s.caixaId)) concluidosByCaixa.set(s.caixaId, new Set())
    concluidosByCaixa.get(s.caixaId)!.add(s.tipo)
  }
  const router = useRouter()
  const [form, setForm] = useState({ tracking: '', lojaOrigem: '', observacoes: '' })
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [etiquetas, setEtiquetas] = useState<File[]>([])
  const [salvando, setSalvando] = useState(false)

  const MAX_FOTOS_ETIQUETA = 5

  async function registrarCaixa() {
    if (form.tracking.trim().length < 3) return toast.error('Informe o número de rastreamento')
    if (!comprovante) return toast.error('Envie o comprovante da compra')
    setSalvando(true)
    try {
      const data = new FormData()
      data.append('files', comprovante)
      const up = await fetch('/api/uploads/operacional', { method: 'POST', body: data })
      if (!up.ok) throw new Error((await up.json()).error ?? 'Falha no upload do comprovante')
      const { urls: urlsComprovante } = await up.json() as { urls: string[] }
      const comprovanteCompraUrl = urlsComprovante[0]

      let fotoEtiquetaUrl: string | undefined
      let fotoEtiquetaUrls: string[] | undefined
      if (etiquetas.length > 0) {
        const etiquetaData = new FormData()
        etiquetas.slice(0, MAX_FOTOS_ETIQUETA).forEach(f => etiquetaData.append('files', f))
        const et = await fetch('/api/uploads/operacional', { method: 'POST', body: etiquetaData })
        if (!et.ok) throw new Error((await et.json()).error ?? 'Falha no upload da etiqueta')
        const etUrls = await et.json() as { urls: string[] }
        fotoEtiquetaUrls = etUrls.urls
        fotoEtiquetaUrl = etUrls.urls[0]
      }

      const res = await fetch('/api/caixas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking: form.tracking.trim(),
          lojaOrigem: form.lojaOrigem.trim() || undefined,
          observacoes: form.observacoes.trim() || undefined,
          comprovanteCompraUrl,
          fotoEtiquetaUrl,
          fotoEtiquetaUrls,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Não foi possível registrar')
      toast.success('Caixa registrada! Aguardando recebimento no armazém. A equipe confirmará quando a caixa chegar fisicamente.')
      setForm({ tracking: '', lojaOrigem: '', observacoes: '' })
      setComprovante(null)
      setEtiquetas([])
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-lg p-5">
        <h2 className="font-semibold mb-1 flex items-center gap-2" style={{ color: '#1A1A2E' }}><PackageSearch className="w-4 h-4" /> Registrar nova caixa</h2>
        <p className="text-xs mb-4" style={{ color: '#6B7280' }}>Após realizar uma compra, registre o rastreamento aqui. O status permanecerá como <strong>A caminho</strong> até que nossa equipe confirme fisicamente a chegada no armazém. Se já tiver a foto da etiqueta, envie junto — ela ficará armazenada para conferência, mas a confirmação só será feita pela administração.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.tracking} onChange={e => setForm(f => ({ ...f, tracking: e.target.value }))} placeholder="Tracking" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
          <input value={form.lojaOrigem} onChange={e => setForm(f => ({ ...f, lojaOrigem: e.target.value }))} placeholder="Loja de origem" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
          <input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Observações (opcional)" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
          <label className="h-10 rounded-lg border border-dashed border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> {comprovante ? comprovante.name : 'Comprovante da compra *'}
            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={e => setComprovante(e.target.files?.[0] ?? null)} />
          </label>
          <label className="h-10 rounded-lg border border-dashed border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> {etiquetas.length > 0 ? `${etiquetas.length} foto(s) — clique para adicionar mais` : 'Fotos da etiqueta (opcional, até 5)'}
            <input type="file" className="hidden" accept="image/*" multiple onChange={e => setEtiquetas(prev => [...prev, ...Array.from(e.target.files ?? [])].slice(0, MAX_FOTOS_ETIQUETA))} />
          </label>
        </div>
        <button type="button" onClick={registrarCaixa} disabled={salvando} className="mt-4 h-10 rounded-lg px-4 text-sm font-semibold text-white" style={{ background: '#FF6B9D' }}>
          {salvando ? 'Registrando...' : 'Registrar caixa'}
        </button>
      </div>

      {/* Legenda cores por serviço — como no print KLivewh */}
      <div className="bg-white border border-gray-100 rounded-lg p-4">
        {ordemTipos.map(t => (
          <div key={t} className="flex items-center gap-2 text-sm py-2 border-b border-dashed border-gray-100 last:border-0 last:pb-0">
            <span className="w-4 h-4 rounded-full shrink-0" style={{ background: servicoMeta[t].color }} />
            <span style={{ color: '#374151' }}>: {servicoMeta[t].legend}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {caixas.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-lg p-6 text-center text-sm" style={{ color: '#6B7280' }}>
            Nenhuma caixa registrada ainda. Registre o rastreamento da sua primeira compra acima.
          </div>
        )}
        {caixas.map(caixa => {
          const pendente = caixa.status === 'PENDENTE'
          return (
            <Link key={caixa.id} href={`/tracking/${caixa.id}`} className="block">
              <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium" style={{ color: '#1A1A2E' }}>{caixa.tracking}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                      Registrada em {new Date(caixa.criadoEm).toLocaleDateString('pt-BR')}
                      {caixa.lojaOrigem ? ` · ${caixa.lojaOrigem}` : ''}
                      {caixa.recebidoEm ? ` · Recebida em ${new Date(caixa.recebidoEm).toLocaleDateString('pt-BR')}` : ''}
                    </p>
                    {caixa.observacoes && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{caixa.observacoes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pendente ? (
                      <span className="rounded px-2 py-1 text-xs font-medium bg-amber-100" style={{ color: '#92400E' }}>
                        A caminho
                      </span>
                    ) : (
                      <span className="rounded px-2 py-1 text-xs font-medium bg-green-100" style={{ color: '#047857' }}>
                        Recebida no armazém
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4" style={{ color: '#D1D5DB' }} />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  {ordemTipos.map(t => {
                    const done = concluidosByCaixa.get(caixa.id)?.has(t)
                    return <span key={t} title={`${servicoMeta[t].label}${done ? ' — concluído' : ''}`} className="w-3.5 h-3.5 rounded-full border" style={{ background: done ? servicoMeta[t].color : '#F3F4F6', borderColor: done ? servicoMeta[t].color : '#E5E7EB' }} />
                  })}
                  <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>serviços desta caixa</span>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <a href={caixa.comprovanteCompraUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="rounded bg-gray-100 px-2 py-1 text-xs">Comprovante</a>
                  {(caixa.fotoEtiquetaUrls && caixa.fotoEtiquetaUrls.length > 0 ? caixa.fotoEtiquetaUrls : caixa.fotoEtiquetaUrl ? [caixa.fotoEtiquetaUrl] : []).map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Etiqueta" className="w-8 h-8 rounded object-cover border" style={{ borderColor: '#E5E7EB' }} />
                      Foto etiqueta
                    </a>
                  ))}
                  {!pendente && <span className="ml-auto text-xs" style={{ color: '#22C55E' }}>Clique para ver detalhes</span>}
                  {pendente && <span className="ml-auto text-xs" style={{ color: '#9CA3AF' }}>Clique para ver detalhes</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
