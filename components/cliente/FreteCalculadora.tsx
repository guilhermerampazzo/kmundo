'use client'

import { useState } from 'react'
import { Calculator, AlertTriangle, Package, Globe, Weight, Info } from 'lucide-react'
import { toast } from 'sonner'
import { formatarMoeda } from '@/lib/moeda'

type Pais = { id: string; nome: string; codigo: string; moeda: string }
type Caixa = { id: string; nome: string; descricao: string | null; comprimento: number | null; largura: number | null; altura: number | null; pesoMax: number | null }

export function FreteCalculadora({ paises, caixas }: { paises: Pais[]; caixas: Caixa[] }) {
  const [paisId, setPaisId] = useState('')
  const [peso, setPeso] = useState('')
  const [caixaTipoId, setCaixaTipoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<null | { encontrado: boolean; valor: number | null; moeda: string | null; taxaServico: number; total: number | null; mensagem?: string; tarifa?: { pesoMin: number; pesoMax: number } | null }>(null)

  async function calcular() {
    if (!paisId) return toast.error('Selecione o país de destino')
    const pesoNum = Number(peso.replace(',', '.'))
    if (!peso || isNaN(pesoNum) || pesoNum <= 0) return toast.error('Informe um peso válido (kg)')
    setLoading(true)
    try {
      const res = await fetch('/api/frete/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paisId, peso: pesoNum, caixaTipoId: caixaTipoId || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ? 'Verifique os campos' : 'Erro ao calcular')
        setResultado(null)
        return
      }
      setResultado(json)
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const paisSelecionado = paises.find(p => p.id === paisId)
  const caixaSelecionada = caixas.find(c => c.id === caixaTipoId)

  return (
    <div className="space-y-6">
      {/* Form card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FF6B9D,#C77DFF)' }}>
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: '#1A1A2E' }}>Simule seu frete</h2>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>País + peso + caixa → estimativa instantânea</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5" style={{ color: '#374151' }}><Globe className="w-4 h-4" style={{ color: '#FF6B9D' }} />País de destino *</label>
            <select value={paisId} onChange={e => setPaisId(e.target.value)} className="w-full h-11 px-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-200" style={{ borderColor: '#E5E7EB' }}>
              <option value="">Selecione o país</option>
              {paises.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.codigo}) — {p.moeda}</option>)}
            </select>
            {paises.length === 0 && <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>Nenhum país cadastrado ainda.</p>}
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5" style={{ color: '#374151' }}><Weight className="w-4 h-4" style={{ color: '#FF6B9D' }} />Peso da caixa (kg) *</label>
            <input value={peso} onChange={e => setPeso(e.target.value)} inputMode="decimal" placeholder="ex: 1.5" className="w-full h-11 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" style={{ borderColor: '#E5E7EB' }} />
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Use ponto ou vírgula</p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5" style={{ color: '#374151' }}><Package className="w-4 h-4" style={{ color: '#FF6B9D' }} />Tamanho da caixa</label>
            <select value={caixaTipoId} onChange={e => setCaixaTipoId(e.target.value)} className="w-full h-11 px-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-200" style={{ borderColor: '#E5E7EB' }}>
              <option value="">Selecione (opcional)</option>
              {caixas.map(c => <option key={c.id} value={c.id}>{c.nome} {c.comprimento ? `— ${c.comprimento}×${c.largura}×${c.altura}cm` : ''} {c.pesoMax ? `• até ${c.pesoMax}kg` : ''}</option>)}
            </select>
          </div>
        </div>

        {caixaSelecionada && (
          <div className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#FFF1F5', border: '1px solid #FFE4E6' }}>
            <Package className="w-5 h-5 shrink-0" style={{ color: '#FF6B9D' }} />
            <div className="text-sm">
              <p className="font-medium" style={{ color: '#1A1A2E' }}>{caixaSelecionada.nome}</p>
              <p style={{ color: '#6B7280' }}>{[caixaSelecionada.comprimento && `${caixaSelecionada.comprimento}cm`, caixaSelecionada.largura && `${caixaSelecionada.largura}cm`, caixaSelecionada.altura && `${caixaSelecionada.altura}cm`].filter(Boolean).join(' × ') || 'Medidas sob consulta'} {caixaSelecionada.pesoMax ? `• até ${caixaSelecionada.pesoMax} kg` : ''} {caixaSelecionada.descricao ? `— ${caixaSelecionada.descricao}` : ''}</p>
            </div>
          </div>
        )}

        <button type="button" onClick={calcular} disabled={loading} className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg,#FF6B9D,#C77DFF)' }}>
          <Calculator className="w-4 h-4" />{loading ? 'Calculando...' : 'Calcular frete'}
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden" style={{ background: resultado.encontrado ? 'linear-gradient(135deg,#FF6B9D 0%,#C77DFF 100%)' : 'linear-gradient(135deg,#6B7280,#4B5563)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(20%,-20%)' }} />
          <div className="relative z-10">
            {resultado.encontrado ? (
              <>
                <p className="text-white/80 text-sm font-medium flex items-center gap-2"><Info className="w-4 h-4" /> Estimativa para {paisSelecionado?.nome ?? 'seu país'}</p>
                <p className="text-4xl sm:text-5xl font-bold mt-2">{formatarMoeda(Number(resultado.total), resultado.moeda ?? 'BRL')}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.2)' }}>Frete: {formatarMoeda(Number(resultado.valor), resultado.moeda ?? 'BRL')}</span>
                  {resultado.taxaServico > 0 && <span className="px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.2)' }}>Taxa serviço: {formatarMoeda(Number(resultado.taxaServico), resultado.moeda ?? 'BRL')}</span>}
                  {resultado.tarifa && <span className="px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>Faixa {resultado.tarifa.pesoMin}–{resultado.tarifa.pesoMax} kg</span>}
                </div>
                <p className="text-white/80 text-xs mt-4 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Valor apenas estimativo — o valor final será confirmado pela equipe no fechamento.</p>
              </>
            ) : (
              <>
                <p className="font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Sem tarifa para essa combinação</p>
                <p className="text-white/90 text-sm mt-2">{resultado.mensagem}</p>
                <p className="text-white/70 text-xs mt-3">Tente outro peso/caixa ou entre em contato com a equipe.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
