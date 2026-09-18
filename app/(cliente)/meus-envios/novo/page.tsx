'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Check } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type MetodoEnvio = 'EMS' | 'ENVIO_EM_GRUPO'

interface ItemDisponivel {
  id: string
  descricao: string
  lojaOrigem: string | null
  status: string
}

interface CaixaDisponivel {
  id: string
  tracking: string
  lojaOrigem: string | null
  status: string
}

const metodos: { value: MetodoEnvio; label: string; desc: string }[] = [
  { value: 'EMS', label: 'EMS', desc: 'Serviço postal expresso' },
  { value: 'ENVIO_EM_GRUPO', label: 'Envio em Grupo', desc: 'Consolide com outras clientes e economize' },
]

export default function NovoEnvioPage() {
  const router = useRouter()
  const [metodo, setMetodo] = useState<MetodoEnvio | null>(null)
  const [itensDisponiveis, setItensDisponiveis] = useState<ItemDisponivel[]>([])
  const [itensSelecionados, setItensSelecionados] = useState<Set<string>>(new Set())
  const [caixasDisponiveis, setCaixasDisponiveis] = useState<CaixaDisponivel[]>([])
  const [caixasSelecionadas, setCaixasSelecionadas] = useState<Set<string>>(new Set())
  const [valorDeclaradoTexto, setValorDeclaradoTexto] = useState('')
  const [enderecoCompleto, setEnderecoCompleto] = useState('')
  const [usarEnderecoCoreano, setUsarEnderecoCoreano] = useState(false)
  const [enderecoCoreano, setEnderecoCoreano] = useState('')
  const [telefoneCoreano, setTelefoneCoreano] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<{
    titulo?: string | null; subtitulo?: string | null; introducaoHtml?: string | null; termosUsoHtml?: string | null
    avisoValorDeclaradoHtml?: string | null; avisoEnderecoHtml?: string | null; avisoEnderecoCoreanoHtml?: string | null
    painelInfoHtml?: string | null; prazosHtml?: string | null; pagamentoHtml?: string | null; comprovanteHtml?: string | null
    envioHtml?: string | null; recebimentoHtml?: string | null; regrasAdicionaisHtml?: string | null
  } | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const [r1, r2, r3, rc] = await Promise.all([
          fetch('/api/itens?status=RECEBIDO&limite=100').then(r => r.json()),
          fetch('/api/itens?status=EM_ARMAZEM&limite=100').then(r => r.json()),
          fetch('/api/itens?status=EM_ENVIO&limite=100').then(r => r.json()),
          fetch('/api/caixas').then(r => r.json()).catch(() => []),
        ])
        setItensDisponiveis([...(r1.itens ?? []), ...(r2.itens ?? []), ...(r3.itens ?? [])])
        setCaixasDisponiveis(Array.isArray(rc) ? rc : (rc.caixas ?? []))
        fetch('/api/envios/config').then(r => r.json()).then(c => setConfig(c)).catch(() => {})
      } catch {
        setError('Erro ao carregar itens')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  function toggleItem(id: string) {
    setItensSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleCaixa(id: string) {
    setCaixasSelecionadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalSelecionados = itensSelecionados.size + caixasSelecionadas.size

  async function handleSubmit() {
    if (!metodo) { setError('Selecione o método de envio'); return }
    if (totalSelecionados === 0) { setError('Selecione ao menos um item ou uma caixa'); return }
    if (!enderecoCompleto.trim() || enderecoCompleto.trim().length < 10) { setError('Endereço completo de envio é obrigatório'); return }
    if (metodo !== 'ENVIO_EM_GRUPO' && valorDeclaradoTexto.trim().length < 3) { setError('Valor declarado é obrigatório para envios individuais'); return }
    if (usarEnderecoCoreano && (!enderecoCoreano.trim() || enderecoCoreano.trim().length < 5)) { setError('Informe o endereço coreano completo'); return }
    if (usarEnderecoCoreano && (!telefoneCoreano.trim() || telefoneCoreano.trim().length < 5)) { setError('Informe o telefone do responsável (endereço coreano)'); return }
    if (!aceitouTermos) { setError('Você deve aceitar os Termos de Uso para continuar'); return }

    setSalvando(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        metodoEnvio: metodo,
        itemIds: Array.from(itensSelecionados),
        caixaIds: Array.from(caixasSelecionadas),
        valorDeclaradoTexto: valorDeclaradoTexto.trim() || null,
        enderecoCompleto: enderecoCompleto.trim(),
        usarEnderecoCoreano,
        enderecoCoreano: usarEnderecoCoreano ? enderecoCoreano.trim() : null,
        telefoneCoreano: usarEnderecoCoreano ? telefoneCoreano.trim() : null,
        aceitouTermos: true,
      }

      const res = await fetch('/api/envios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Envio solicitado com sucesso! Status: Aguardando confirmação')
        router.push(`/meus-envios/${data.id}`)
      } else {
        const json = await res.json()
        const fieldErr = json.error?.valorDeclaradoTexto?._errors?.[0] ?? json.error?.enderecoCompleto?._errors?.[0] ?? json.error?.enderecoCoreano?._errors?.[0] ?? json.error?.telefoneCoreano?._errors?.[0] ?? json.error?.itemIds?._errors?.[0] ?? json.error?.aceitouTermos?._errors?.[0]
        const msg = fieldErr ?? json.error ?? 'Erro ao solicitar envio'
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setSalvando(false)
    }
  }

  const podeEnviar = metodo && totalSelecionados > 0 && aceitouTermos && enderecoCompleto.trim().length >= 10 && (metodo === 'ENVIO_EM_GRUPO' || valorDeclaradoTexto.trim().length >= 3) && (!usarEnderecoCoreano || (enderecoCoreano.trim().length >= 5 && telefoneCoreano.trim().length >= 5))

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/meus-envios">
          <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>{config?.titulo?.trim() || 'Solicitar Envio'}</h1>
          <p style={{ color: '#6B7280' }}>{config?.subtitulo?.trim() || 'Preencha todos os campos obrigatórios para enviar'}</p>
        </div>
      </div>

      {config?.introducaoHtml?.trim() && (
        <div className="bg-white rounded-2xl p-6 mb-5 termos-content" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #FF6B9D' }} dangerouslySetInnerHTML={{ __html: config.introducaoHtml }} />
      )}
      {config?.painelInfoHtml?.trim() && (
        <div className="bg-white rounded-2xl p-6 mb-5 termos-content" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: config.painelInfoHtml }} />
      )}

      {error && (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {/* Método de envio */}
      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Método de Envio *</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metodos.map(m => {
            const ativo = metodo === m.value
            return (
              <button key={m.value} type="button" onClick={() => setMetodo(m.value)} className="p-4 rounded-xl border-2 text-left transition-all" style={{ borderColor: ativo ? '#FF6B9D' : '#E5E7EB', background: ativo ? '#FFF1F5' : 'white' }}>
                <p className="font-semibold text-sm mb-1" style={{ color: ativo ? '#FF6B9D' : '#1A1A2E' }}>{m.label}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{m.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Itens */}
      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-1" style={{ color: '#1A1A2E' }}>Selecionar Itens</h2>
        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Itens registrados no armazém. Você pode enviar só itens, só caixas ou os dois juntos.</p>
        {carregando ? (
          <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>Carregando itens...</p>
        ) : itensDisponiveis.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>Nenhum item disponível para envio</p>
        ) : (
          <div className="space-y-2">
            {itensDisponiveis.map(item => {
              const sel = itensSelecionados.has(item.id)
              return (
                <button key={item.id} type="button" onClick={() => toggleItem(item.id)} className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left" style={{ borderColor: sel ? '#FF6B9D' : '#E5E7EB', background: sel ? '#FFF1F5' : 'white' }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center border-2 shrink-0" style={{ borderColor: sel ? '#FF6B9D' : '#D1D5DB', background: sel ? '#FF6B9D' : 'white' }}>
                    {sel && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1A1A2E' }}>{item.descricao}</p>
                    {item.lojaOrigem && <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.lojaOrigem}</p>}
                  </div>
                  <Package className="w-4 h-4" style={{ color: '#D1D5DB' }} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Caixas */}
      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-1" style={{ color: '#1A1A2E' }}>Selecionar Caixas</h2>
        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Caixas que você registrou no Tracking, com o número de rastreamento.</p>
        {carregando ? (
          <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>Carregando caixas...</p>
        ) : caixasDisponiveis.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>Nenhuma caixa registrada. Registre em Tracking.</p>
        ) : (
          <div className="space-y-2">
            {caixasDisponiveis.map(caixa => {
              const sel = caixasSelecionadas.has(caixa.id)
              return (
                <button key={caixa.id} type="button" onClick={() => toggleCaixa(caixa.id)} className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left" style={{ borderColor: sel ? '#FF6B9D' : '#E5E7EB', background: sel ? '#FFF1F5' : 'white' }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center border-2 shrink-0" style={{ borderColor: sel ? '#FF6B9D' : '#D1D5DB', background: sel ? '#FF6B9D' : 'white' }}>
                    {sel && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate font-mono" style={{ color: '#1A1A2E' }}>{caixa.tracking}</p>
                    {caixa.lojaOrigem && <p className="text-xs" style={{ color: '#9CA3AF' }}>{caixa.lojaOrigem} · {caixa.status}</p>}
                  </div>
                  <Package className="w-4 h-4" style={{ color: '#D1D5DB' }} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Valor Declarado */}
      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <label className="font-semibold block mb-1" style={{ color: '#1A1A2E' }}>Valor declarado / Declaração de conteúdo {metodo !== 'ENVIO_EM_GRUPO' && <span style={{ color: '#EF4444' }}>*</span>}</label>
        <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Nome do item + valor declarado em dólar. Ex:</p>
        <div className="rounded-lg p-3 mb-3 text-xs font-mono" style={{ background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' }}>
          Álbum BTS — US$ 25<br />Photocard — US$ 10
        </div>
        <textarea value={valorDeclaradoTexto} onChange={e => setValorDeclaradoTexto(e.target.value)} rows={4} className="w-full rounded-xl border p-3 text-sm" style={{ borderColor: '#E5E7EB' }} placeholder="Álbum BTS — US$ 25&#10;Photocard — US$ 10" />
        <p className="text-xs mt-2" style={{ color: metodo !== 'ENVIO_EM_GRUPO' ? '#EF4444' : '#9CA3AF' }}>
          Importante: o preenchimento do valor declarado é obrigatório para envios individuais. Em envios em grupo, o preenchimento do valor declarado não é obrigatório.
        </p>
        <div className="mt-3 rounded-xl p-3 text-xs leading-relaxed" style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#9A3412' }}>
          O cliente deve informar corretamente o nome do item conforme deseja que ele seja declarado na etiqueta, juntamente com o valor declarado em dólar. A K-Mundo Warehouse não se responsabiliza pelos valores ou informações escolhidos pelo cliente. As informações serão adicionadas conforme foram preenchidas pelo próprio cliente. Caso exista alguma impossibilidade de utilizar exatamente o nome informado na etiqueta, entraremos em contato para orientá-lo.
        </div>
        {config?.avisoValorDeclaradoHtml && <div className="mt-3 termos-content text-xs" dangerouslySetInnerHTML={{ __html: config.avisoValorDeclaradoHtml }} />}
      </div>

      {/* Endereço completo */}
      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <label className="font-semibold block mb-1" style={{ color: '#1A1A2E' }}>Endereço completo de envio *</label>
        <textarea value={enderecoCompleto} onChange={e => setEnderecoCompleto(e.target.value)} rows={4} className="w-full rounded-xl border p-3 text-sm" style={{ borderColor: '#E5E7EB' }} placeholder="Rua, número, complemento, cidade, estado, país, CEP, e-mail, telefone..." />
        <div className="mt-2 rounded-xl p-3 text-xs leading-relaxed" style={{ background: '#FFF1F5', border: '1px solid #FFE4E6', color: '#9F1239' }}>
          Endereço completo de envio — obrigatório: informe todos os dados necessários para a entrega, incluindo endereço completo, número da residência ou apartamento, cidade, estado, país, e-mail, telefone e quaisquer outras informações necessárias para a entrega. Confira cuidadosamente os dados antes de enviar a solicitação.
        </div>
        {config?.avisoEnderecoHtml && <div className="mt-3 termos-content text-xs" dangerouslySetInnerHTML={{ __html: config.avisoEnderecoHtml }} />}
      </div>

      {/* Endereço coreano */}
      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={usarEnderecoCoreano} onChange={e => setUsarEnderecoCoreano(e.target.checked)} className="w-4 h-4 rounded border-gray-300 accent-pink-500" />
          <span className="font-semibold text-sm" style={{ color: '#1A1A2E' }}>Utilizar endereço coreano</span>
        </label>
        {usarEnderecoCoreano && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: '#374151' }}>Endereço completo em coreano *</label>
              <textarea value={enderecoCoreano} onChange={e => setEnderecoCoreano(e.target.value)} rows={3} className="w-full rounded-xl border p-3 text-sm" style={{ borderColor: '#E5E7EB' }} placeholder="주소 전체를 한국어로 입력하세요" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: '#374151' }}>Telefone da pessoa responsável *</label>
              <input value={telefoneCoreano} onChange={e => setTelefoneCoreano(e.target.value)} placeholder="010-xxxx-xxxx" className="w-full h-11 rounded-xl border px-3 text-sm" style={{ borderColor: '#E5E7EB' }} />
            </div>
            <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: '#FEFCE8', border: '1px solid #FEF08A', color: '#854D0E' }}>
              Importante: se você estiver utilizando um endereço coreano, é obrigatório informar o endereço completo em coreano e o número de telefone da pessoa responsável pelo recebimento. Confira todas as informações antes de solicitar o envio.
            </div>
            {config?.avisoEnderecoCoreanoHtml && <div className="termos-content text-xs" dangerouslySetInnerHTML={{ __html: config.avisoEnderecoCoreanoHtml }} />}
          </div>
        )}
      </div>

      {/* Termos */}
      <div className="bg-white rounded-2xl p-5 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={aceitouTermos} onChange={e => { setAceitouTermos(e.target.checked); if (e.target.checked) setError('') }} className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-pink-500 flex-shrink-0" />
          <span className="text-sm leading-relaxed" style={{ color: '#374151' }}>
            Li e concordo com os <Link href="/termos" target="_blank" className="font-semibold underline" style={{ color: '#FF6B9D' }}>Termos de Uso e Condições do Serviço</Link> e estou ciente das condições desta solicitação de envio. *
          </span>
        </label>
        {config?.termosUsoHtml?.trim() && (
          <div className="mt-4 rounded-xl p-4 max-h-64 overflow-y-auto termos-content text-sm" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }} dangerouslySetInnerHTML={{ __html: config.termosUsoHtml }} />
        )}
      </div>

      {(config?.prazosHtml?.trim() || config?.pagamentoHtml?.trim() || config?.comprovanteHtml?.trim() || config?.envioHtml?.trim() || config?.recebimentoHtml?.trim() || config?.regrasAdicionaisHtml?.trim()) && (
        <div className="space-y-3 mb-6">
          {config?.prazosHtml?.trim() && <div className="bg-white rounded-2xl p-5 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: config.prazosHtml }} />}
          {config?.pagamentoHtml?.trim() && <div className="bg-white rounded-2xl p-5 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: config.pagamentoHtml }} />}
          {config?.comprovanteHtml?.trim() && <div className="bg-white rounded-2xl p-5 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: config.comprovanteHtml }} />}
          {config?.envioHtml?.trim() && <div className="bg-white rounded-2xl p-5 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: config.envioHtml }} />}
          {config?.recebimentoHtml?.trim() && <div className="bg-white rounded-2xl p-5 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: config.recebimentoHtml }} />}
          {config?.regrasAdicionaisHtml?.trim() && <div className="bg-white rounded-2xl p-5 termos-content text-sm" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} dangerouslySetInnerHTML={{ __html: config.regrasAdicionaisHtml }} />}
        </div>
      )}

      <Button type="button" onClick={handleSubmit} disabled={salvando || !podeEnviar} className="w-full h-12 font-semibold text-white rounded-xl disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF4D8D)', borderRadius: '12px' }}>
        {salvando ? 'Solicitando...' : `Solicitar Envio (${totalSelecionados} ${totalSelecionados === 1 ? 'item' : 'itens'})`}
      </Button>
      {!podeEnviar && !salvando && (
        <p className="text-xs text-center mt-2" style={{ color: '#DC2626' }}>
          Para solicitar: {!metodo ? 'selecione o método de envio; ' : ''}{totalSelecionados === 0 ? 'selecione ao menos 1 item ou 1 caixa; ' : ''}{enderecoCompleto.trim().length < 10 ? 'preencha o endereço completo; ' : ''}{metodo !== 'ENVIO_EM_GRUPO' && valorDeclaradoTexto.trim().length < 3 ? 'informe o valor declarado; ' : ''}{usarEnderecoCoreano && (enderecoCoreano.trim().length < 5 || telefoneCoreano.trim().length < 5) ? 'complete o endereço/telefone coreano; ' : ''}{!aceitouTermos ? 'aceite os Termos de Uso.' : ''}
        </p>
      )}
      <p className="text-xs text-center mt-3" style={{ color: '#9CA3AF' }}>
        Após a solicitação, o pedido ficará em <strong>Aguardando confirmação</strong>. Nossa equipe irá informar o valor do frete e as próximas etapas.
      </p>
    </div>
  )
}
