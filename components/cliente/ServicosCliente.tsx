'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PackagePlus, Upload } from 'lucide-react'
import { toast } from 'sonner'

type Caixa = { id: string; tracking: string; lojaOrigem: string | null }
type Servico = { id: string; tipo: string; status: string; descricao: string | null; peso: number | null; largura: number | null; altura: number | null; comprimento: number | null; fotoUrls: string[]; videoUrl: string | null; observacoesEquipe: string | null; caixa: { tracking: string } | null; criadoEm: Date | string }

type Precos = {
  UNBOXING: number
  FOTO_VIDEO: number
  MEDICAO: number
  REEMBALAGEM: number
  OUTRO: number
  moeda: string
}

const tipos = [
  ['FOTO_VIDEO', 'Foto/vídeo'],
  ['MEDICAO', 'Peso e tamanho'],
  ['REEMBALAGEM', 'Reembalagem'],
  ['OUTRO', 'Outro'],
] as const

type TipoServico = (typeof tipos)[number][0]

export function ServicosCliente({ caixas, servicos, precos, totalPendente, moedaTotal }: { caixas: Caixa[]; servicos: Servico[]; precos: Precos; totalPendente?: number; moedaTotal?: string }) {
  const router = useRouter()
  const [caixaId, setCaixaId] = useState(caixas[0]?.id ?? '')
  const [tipo, setTipo] = useState('FOTO_VIDEO')
  const [descricao, setDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [mostrarNovaCaixa, setMostrarNovaCaixa] = useState(false)
  const [novaCaixa, setNovaCaixa] = useState({ tracking: '', lojaOrigem: '', observacoes: '' })
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [etiquetas, setEtiquetas] = useState<File[]>([])
  const [salvandoCaixa, setSalvandoCaixa] = useState(false)

  const MAX_FOTOS_ETIQUETA = 5

  const precoAtual = precos[tipo as TipoServico]

  function formatarPreco(valor: number) {
    if (valor <= 0) return 'consultar'
    const moeda = precos.moeda
    if (moeda === 'KRW') return `${Math.round(valor).toLocaleString('en-US')} ${moeda}`
    return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moeda}`
  }

  function formatarMoeda(valor: number, moeda: string) {
    if (moeda === 'KRW') return `${Math.round(valor).toLocaleString('en-US')} ${moeda}`
    return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moeda}`
  }

  async function registrarCaixa() {
    if (novaCaixa.tracking.trim().length < 3) return toast.error('Informe o número de rastreamento')
    if (!comprovante) return toast.error('Envie o comprovante da compra')
    setSalvandoCaixa(true)
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
          tracking: novaCaixa.tracking.trim(),
          lojaOrigem: novaCaixa.lojaOrigem.trim() || undefined,
          observacoes: novaCaixa.observacoes.trim() || undefined,
          comprovanteCompraUrl,
          fotoEtiquetaUrl,
          fotoEtiquetaUrls,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Não foi possível registrar')
      const caixaCriada = await res.json() as { id: string }
      toast.success('Caixa registrada! Aguardando recebimento no armazém.')
      setNovaCaixa({ tracking: '', lojaOrigem: '', observacoes: '' })
      setComprovante(null)
      setEtiquetas([])
      setMostrarNovaCaixa(false)
      setCaixaId(caixaCriada.id)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar')
    } finally {
      setSalvandoCaixa(false)
    }
  }

  async function solicitar() {
    if (tipo === 'OUTRO' && descricao.trim().length < 3) {
      toast.error('Descreva o serviço que você precisa no campo de detalhes')
      return
    }
    setSalvando(true)
    const res = await fetch('/api/servicos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caixaId: caixaId || undefined, tipo, descricao: descricao.trim() || undefined }),
    })
    setSalvando(false)
    if (res.ok) {
      toast.success('Serviço solicitado')
      setDescricao('')
      router.refresh()
    } else toast.error((await res.json()).error ?? 'Não foi possível solicitar')
  }

  return (
    <div className="space-y-6">
      {typeof totalPendente === 'number' && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: totalPendente > 0 ? '#FEF3C7' : '#F0FDF4', border: `1px solid ${totalPendente > 0 ? '#FDE68A' : '#BBF7D0'}` }}>
          <div>
            <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: totalPendente > 0 ? '#92400E' : '#166534' }}>
              {totalPendente > 0 ? '🧾 Caixinha — serviços pendentes' : '✅ Nenhuma pendência'}
            </p>
            <p className="text-xs mt-1" style={{ color: totalPendente > 0 ? '#78350F' : '#16A34A' }}>
              {totalPendente > 0 ? `Acumulado de serviços solicitados — pague tudo de uma vez ou junto com o frete` : 'Você está em dia. Pode solicitar envio normalmente.'}
            </p>
          </div>
          <p className="text-lg font-bold" style={{ color: totalPendente > 0 ? '#92400E' : '#166534' }}>{formatarMoeda(totalPendente, moedaTotal || precos.moeda)}</p>
        </div>
      )}
      {typeof totalPendente === 'number' && totalPendente > 0 && (
        <div className="rounded-lg p-3 text-xs" style={{ background: '#FFF1F5', border: '1px solid #FECDD3', color: '#9F1239' }}>
          ⚠️ Enquanto houver pendência, você <strong>não poderá solicitar envio</strong> da caixa com pendência. Regularize em <strong>Financeiro</strong> ou pague junto com o frete.
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: '#1A1A2E' }}>Solicitar serviço</h2>
          <button
            type="button"
            onClick={() => setMostrarNovaCaixa(v => !v)}
            className="flex items-center gap-1.5 h-9 rounded-lg px-3 text-xs font-semibold"
            style={{ background: '#FFF1F5', color: '#FF6B9D' }}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            {mostrarNovaCaixa ? 'Fechar' : 'Registrar nova caixa'}
          </button>
        </div>

        {mostrarNovaCaixa && (
          <div className="mb-5 rounded-lg border border-dashed border-gray-300 p-4">
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Após realizar uma compra, registre o rastreamento para vincular o serviço. Se já tiver a foto da etiqueta, envie para confirmar o recebimento na hora.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={novaCaixa.tracking} onChange={e => setNovaCaixa(f => ({ ...f, tracking: e.target.value }))} placeholder="Tracking" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
              <input value={novaCaixa.lojaOrigem} onChange={e => setNovaCaixa(f => ({ ...f, lojaOrigem: e.target.value }))} placeholder="Loja de origem" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
              <input value={novaCaixa.observacoes} onChange={e => setNovaCaixa(f => ({ ...f, observacoes: e.target.value }))} placeholder="Observações (opcional)" className="h-10 rounded-lg border border-gray-200 px-3 text-sm" />
              <label className="h-10 rounded-lg border border-dashed border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> {comprovante ? comprovante.name : 'Comprovante da compra *'}
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={e => setComprovante(e.target.files?.[0] ?? null)} />
              </label>
              <label className="h-10 rounded-lg border border-dashed border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> {etiquetas.length > 0 ? `${etiquetas.length} foto(s) — clique para adicionar mais` : 'Fotos da etiqueta (opcional, até 5)'}
                <input type="file" className="hidden" accept="image/*" multiple onChange={e => setEtiquetas(prev => [...prev, ...Array.from(e.target.files ?? [])].slice(0, MAX_FOTOS_ETIQUETA))} />
              </label>
            </div>
            <button type="button" onClick={registrarCaixa} disabled={salvandoCaixa} className="mt-3 h-10 rounded-lg px-4 text-sm font-semibold text-white" style={{ background: '#FF6B9D' }}>
              {salvandoCaixa ? 'Registrando...' : 'Registrar caixa'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <select value={caixaId} onChange={e => setCaixaId(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm w-full">
              <option value="">Sem caixa vinculada</option>
              {caixas.map(caixa => <option key={caixa.id} value={caixa.id}>{caixa.tracking}{caixa.lojaOrigem ? ` - ${caixa.lojaOrigem}` : ''}</option>)}
            </select>
            {caixas.length === 0 && !mostrarNovaCaixa && (
              <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>Nenhuma caixa registrada. Use “Registrar nova caixa” acima.</p>
            )}
          </div>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm">
            {tipos.map(([value, label]) => (
              <option key={value} value={value}>
                {label} — {formatarPreco(precos[value])}
              </option>
            ))}
          </select>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder={tipo === 'OUTRO' ? 'Descreva aqui o serviço que você precisa *' : 'Detalhes do que precisa'} className="md:col-span-2 min-h-20 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <p className="text-xs mt-3" style={{ color: '#9CA3AF' }}>
          {precoAtual > 0
            ? `O valor de ${tipos.find(([v]) => v === tipo)?.[1]} é ${formatarPreco(precoAtual)}.`
            : 'Valores combinados com a equipe após a solicitação.'}
        </p>
        <button type="button" onClick={solicitar} disabled={salvando} className="mt-3 h-10 rounded-lg px-4 text-sm font-semibold text-white" style={{ background: '#FF6B9D' }}>{salvando ? 'Enviando...' : 'Solicitar serviço'}</button>
      </div>

      <div className="space-y-3">
        {servicos.map(servico => <div key={servico.id} className="bg-white border border-gray-100 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium" style={{ color: '#1A1A2E' }}>{servico.tipo.replaceAll('_', ' ')}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{new Date(servico.criadoEm).toLocaleDateString('pt-BR')} {servico.caixa?.tracking ? `| ${servico.caixa.tracking}` : ''}</p>
            </div>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs">{servico.status.replaceAll('_', ' ')}</span>
          </div>
          {servico.observacoesEquipe && <p className="text-xs mt-2 rounded bg-gray-50 px-2 py-1" style={{ color: '#6B7280' }}>{servico.observacoesEquipe}</p>}
          {(servico.peso || servico.largura || servico.videoUrl || servico.fotoUrls.length > 0) && <div className="mt-3 text-sm" style={{ color: '#374151' }}>
            {servico.peso && <p>Peso: {servico.peso} kg</p>}
            {servico.largura && servico.altura && servico.comprimento && <p>Tamanho: {servico.largura} x {servico.altura} x {servico.comprimento} cm</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {servico.videoUrl && <a href={servico.videoUrl} target="_blank" className="rounded bg-gray-100 px-2 py-1 text-xs">Vídeo</a>}
              {servico.fotoUrls.map((url, idx) => <a key={url} href={url} target="_blank" className="rounded bg-gray-100 px-2 py-1 text-xs">Foto {idx + 1}</a>)}
            </div>
          </div>}
        </div>)}
      </div>
    </div>
  )
}
