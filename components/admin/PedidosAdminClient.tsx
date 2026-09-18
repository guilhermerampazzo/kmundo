'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ShoppingBag, ChevronRight, Save, Search } from 'lucide-react'
import { pedidoStatusTabs, pedidoStatusLabel as statusLabel, pedidoStatusColors as statusColors } from '@/lib/pedido-status'

type Pedido = {
  id: string
  status: string
  criadoEm: string
  cliente: { nomeCompleto: string; numeroDeSuite: number }
  itens: { id: string }[]
}

function MiniEditor({ content, onChange, placeholder }: { content: string; onChange: (v: string) => void; placeholder: string }) {
  // simple textarea for HTML to keep bundle light; admin can paste rich text
  return <textarea value={content ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={5} className="w-full rounded-xl border px-3 py-2 text-sm resize-y" style={{ borderColor: '#E5E7EB' }} />
}

export function PedidosAdminClient({ pedidos, config, initialTab, initialBusca, initialStatus }: { pedidos: Pedido[]; config: { id: string; titulo: string; subtitulo: string | null; introducaoHtml: string | null; comoFuncionaHtml: string | null; passoAPassoHtml: string | null; podeNaoPodeHtml: string | null; etapasHtml: string | null; regrasHtml: string | null; posPedidoHtml: string | null; regrasAdicionaisHtml: string | null } | null; initialTab: string; initialBusca: string; initialStatus: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'pedidos' | 'textos'>(initialTab === 'textos' ? 'textos' : 'pedidos')
  const [busca, setBusca] = useState(initialBusca)
  const [cfg, setCfg] = useState({
    titulo: config?.titulo ?? 'Pedidos de Compra',
    subtitulo: config?.subtitulo ?? '',
    introducaoHtml: config?.introducaoHtml ?? '',
    comoFuncionaHtml: config?.comoFuncionaHtml ?? '',
    passoAPassoHtml: config?.passoAPassoHtml ?? '',
    podeNaoPodeHtml: config?.podeNaoPodeHtml ?? '',
    etapasHtml: config?.etapasHtml ?? '',
    regrasHtml: config?.regrasHtml ?? '',
    posPedidoHtml: config?.posPedidoHtml ?? '',
    regrasAdicionaisHtml: config?.regrasAdicionaisHtml ?? '',
  })
  const [saving, setSaving] = useState(false)

  function navigateWith(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); else sp.delete(k) })
    router.push(`/admin/pedidos?${sp.toString()}`)
  }

  async function salvarTextos() {
    setSaving(true)
    const res = await fetch('/api/pedidos/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) })
    setSaving(false)
    if (res.ok) { toast.success('Textos salvos'); router.refresh() } else toast.error('Erro ao salvar')
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button type="button" onClick={() => { setTab('pedidos'); navigateWith({ tab: 'pedidos' }) }} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'pedidos' ? 'text-white' : 'bg-white border'}`} style={tab === 'pedidos' ? { background: 'linear-gradient(135deg,#FF6B9D,#C77DFF)' } : { borderColor: '#E5E7EB', color: '#6B7280' }}>Pedidos</button>
        <button type="button" onClick={() => { setTab('textos'); navigateWith({ tab: 'textos' }) }} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === 'textos' ? 'text-white' : 'bg-white border'}`} style={tab === 'textos' ? { background: 'linear-gradient(135deg,#FF6B9D,#C77DFF)' } : { borderColor: '#E5E7EB', color: '#6B7280' }}>Textos explicativos</button>
      </div>

      {tab === 'pedidos' ? (
        <>
          <form onSubmit={e => { e.preventDefault(); navigateWith({ busca, status: initialStatus, tab: 'pedidos' }) }} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou nº da suíte (ex: Ana ou 001)" className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm" style={{ borderColor: '#E5E7EB' }} />
            </div>
            <button type="submit" className="h-10 px-4 rounded-xl text-sm font-medium text-white" style={{ background: '#FF6B9D' }}>Buscar</button>
            {initialBusca && <button type="button" onClick={() => { setBusca(''); navigateWith({ busca: '', status: initialStatus, tab: 'pedidos' }) }} className="h-10 px-3 rounded-xl border text-sm" style={{ borderColor: '#E5E7EB' }}>Limpar</button>}
          </form>

          <div className="bg-white rounded-2xl p-3 flex flex-wrap gap-2" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {pedidoStatusTabs.map(t => {
              const ativo = initialStatus === t.value
              return (
                <button key={t.value} type="button" onClick={() => navigateWith({ status: t.value, busca: initialBusca, tab: 'pedidos' })} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: ativo ? '#FF6B9D' : '#F3F4F6', color: ativo ? 'white' : '#6B7280' }}>
                  {t.label}
                </button>
              )
            })}
          </div>

          {pedidos.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: '#E5E7EB' }} />
              <p className="font-medium" style={{ color: '#1A1A2E' }}>Nenhum pedido encontrado</p>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Tente ajustar filtros ou busca.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map(p => (
                <Link key={p.id} href={`/admin/pedidos/${p.id}`}>
                  <div className="bg-white rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFF1F5' }}><ShoppingBag className="w-5 h-5" style={{ color: '#FF6B9D' }} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm" style={{ color: '#1A1A2E' }}>Suite #{String(p.cliente.numeroDeSuite).padStart(3, '0')} — {p.cliente.nomeCompleto}</span>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: statusColors[p.status] ?? '#6B7280' }}>{statusLabel[p.status] ?? p.status}</span>
                      </div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>{p.itens.length} item(ns) · {new Date(p.criadoEm).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#D1D5DB' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 className="font-semibold mb-3" style={{ color: '#1A1A2E' }}>Cabeçalho</h3>
            <input value={cfg.titulo} onChange={e => setCfg(c => ({ ...c, titulo: e.target.value }))} placeholder="Título" className="w-full h-11 px-3 rounded-xl border text-sm mb-3" style={{ borderColor: '#E5E7EB' }} />
            <textarea value={cfg.subtitulo ?? ''} onChange={e => setCfg(c => ({ ...c, subtitulo: e.target.value }))} placeholder="Subtítulo" rows={2} className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
            <div className="mt-3">
              <label className="text-sm font-medium" style={{ color: '#374151' }}>Introdução</label>
              <MiniEditor content={cfg.introducaoHtml ?? ''} onChange={v => setCfg(c => ({ ...c, introducaoHtml: v }))} placeholder="Texto introdutório..." />
            </div>
          </div>

          {[
            { key: 'comoFuncionaHtml', label: 'Como funciona o sistema de pedidos' },
            { key: 'passoAPassoHtml', label: 'Passo a passo' },
            { key: 'podeNaoPodeHtml', label: 'O que pode / não pode fazer' },
            { key: 'etapasHtml', label: 'Etapas do pedido' },
            { key: 'regrasHtml', label: 'Regras e informações importantes' },
            { key: 'posPedidoHtml', label: 'O que acontece depois do pedido' },
            { key: 'regrasAdicionaisHtml', label: 'Regras adicionais' },
          ].map(f => (
            <div key={f.key} className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 className="font-semibold mb-3" style={{ color: '#1A1A2E' }}>{f.label}</h3>
              <MiniEditor content={(cfg as unknown as Record<string, string>)[f.key] ?? ''} onChange={v => setCfg(c => ({ ...c, [f.key]: v }))} placeholder={`Conteúdo de ${f.label.toLowerCase()}...`} />
            </div>
          ))}

          <button type="button" onClick={salvarTextos} disabled={saving} className="inline-flex items-center gap-2 px-6 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#FF6B9D,#FF4D8D)' }}>
            <Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar textos'}
          </button>
        </div>
      )}
    </div>
  )
}
