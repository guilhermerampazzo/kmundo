'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

type Config = {
  id?: string
  titulo?: string | null
  subtitulo?: string | null
  introducaoHtml?: string | null
  termosUsoHtml?: string | null
  avisoValorDeclaradoHtml?: string | null
  avisoEnderecoHtml?: string | null
  avisoEnderecoCoreanoHtml?: string | null
  painelInfoHtml?: string | null
  statusAguardandoConfirmacaoHtml?: string | null
  statusAguardandoPagamentoHtml?: string | null
  statusAguardandoConfirmacaoPagamentoHtml?: string | null
  statusPagamentoFeitoHtml?: string | null
  statusEnviadoHtml?: string | null
  statusCaixaRecebidaHtml?: string | null
  prazosHtml?: string | null
  pagamentoHtml?: string | null
  comprovanteHtml?: string | null
  envioHtml?: string | null
  recebimentoHtml?: string | null
  regrasAdicionaisHtml?: string | null
}

function Field({ label, value, onChange, placeholder, rows = 8 }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 className="font-semibold mb-3" style={{ color: '#1A1A2E' }}>{label}</h3>
      <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
    </div>
  )
}

export function EnvioConfigEditor({ initial }: { initial: Config | null }) {
  const router = useRouter()
  const [cfg, setCfg] = useState<Record<string, string>>({
    titulo: initial?.titulo ?? 'Envios',
    subtitulo: initial?.subtitulo ?? '',
    introducaoHtml: initial?.introducaoHtml ?? '',
    termosUsoHtml: initial?.termosUsoHtml ?? '',
    avisoValorDeclaradoHtml: initial?.avisoValorDeclaradoHtml ?? '',
    avisoEnderecoHtml: initial?.avisoEnderecoHtml ?? '',
    avisoEnderecoCoreanoHtml: initial?.avisoEnderecoCoreanoHtml ?? '',
    painelInfoHtml: initial?.painelInfoHtml ?? '',
    statusAguardandoConfirmacaoHtml: initial?.statusAguardandoConfirmacaoHtml ?? '',
    statusAguardandoPagamentoHtml: initial?.statusAguardandoPagamentoHtml ?? '',
    statusAguardandoConfirmacaoPagamentoHtml: initial?.statusAguardandoConfirmacaoPagamentoHtml ?? '',
    statusPagamentoFeitoHtml: initial?.statusPagamentoFeitoHtml ?? '',
    statusEnviadoHtml: initial?.statusEnviadoHtml ?? '',
    statusCaixaRecebidaHtml: initial?.statusCaixaRecebidaHtml ?? '',
    prazosHtml: initial?.prazosHtml ?? '',
    pagamentoHtml: initial?.pagamentoHtml ?? '',
    comprovanteHtml: initial?.comprovanteHtml ?? '',
    envioHtml: initial?.envioHtml ?? '',
    recebimentoHtml: initial?.recebimentoHtml ?? '',
    regrasAdicionaisHtml: initial?.regrasAdicionaisHtml ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function salvar() {
    setSaving(true)
    const res = await fetch('/api/envios/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) })
    setSaving(false)
    if (res.ok) { toast.success('Textos de Envios salvos'); router.refresh() } else toast.error('Erro ao salvar')
  }

  const fields: Array<{ key: string; label: string; placeholder: string }> = [
    { key: 'introducaoHtml', label: 'Introdução', placeholder: 'Texto introdutório da área de envios...' },
    { key: 'termosUsoHtml', label: 'Termos de Uso e Condições do Serviço (editável)', placeholder: 'Cole aqui os Termos completos...' },
    { key: 'avisoValorDeclaradoHtml', label: 'Aviso Valor Declarado (campo obrigatório)', placeholder: 'Importante: preenchimento obrigatório para individuais...' },
    { key: 'avisoEnderecoHtml', label: 'Aviso Endereço Completo', placeholder: 'Endereço completo — obrigatório...' },
    { key: 'avisoEnderecoCoreanoHtml', label: 'Aviso Endereço Coreano', placeholder: 'Importante: se usar endereço coreano...' },
    { key: 'painelInfoHtml', label: 'Painel Informativo Geral (após solicitação)', placeholder: 'Como funciona o processo de envio, etapas, prazos...' },
    { key: 'statusAguardandoConfirmacaoHtml', label: 'Mensagem status: Aguardando confirmação', placeholder: 'Explicação para Aguardando confirmação...' },
    { key: 'statusAguardandoPagamentoHtml', label: 'Mensagem status: Aguardando pagamento', placeholder: 'Quando informamos valor do frete...' },
    { key: 'statusAguardandoConfirmacaoPagamentoHtml', label: 'Mensagem status: Aguardando confirmação do pagamento', placeholder: 'Comprovante enviado, aguardando conferência...' },
    { key: 'statusPagamentoFeitoHtml', label: 'Mensagem status: Pagamento feito', placeholder: 'Pagamento confirmado, próximos passos...' },
    { key: 'statusEnviadoHtml', label: 'Mensagem status: Enviado', placeholder: 'Rastreamento, como acompanhar...' },
    { key: 'statusCaixaRecebidaHtml', label: 'Mensagem status: Caixa recebida', placeholder: 'Obrigado por confirmar...' },
    { key: 'prazosHtml', label: 'Prazos' , placeholder: 'Quando caixa será fechada...' },
    { key: 'pagamentoHtml', label: 'Instruções de pagamento' , placeholder: 'Como pagar...' },
    { key: 'comprovanteHtml', label: 'Instruções comprovante' , placeholder: 'Como enviar comprovante...' },
    { key: 'envioHtml', label: 'Informações de envio' , placeholder: 'Quando será enviado...' },
    { key: 'recebimentoHtml', label: 'Orientações recebimento' , placeholder: 'O que fazer ao receber...' },
    { key: 'regrasAdicionaisHtml', label: 'Regras adicionais' , placeholder: 'Outras regras...' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h3 className="font-semibold mb-3" style={{ color: '#1A1A2E' }}>Cabeçalho</h3>
        <input value={cfg.titulo} onChange={e => setCfg(c => ({ ...c, titulo: e.target.value }))} placeholder="Título" className="w-full h-11 px-3 rounded-xl border text-sm mb-3" style={{ borderColor: '#E5E7EB' }} />
        <textarea value={cfg.subtitulo} onChange={e => setCfg(c => ({ ...c, subtitulo: e.target.value }))} placeholder="Subtítulo" rows={2} className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
      </div>
      {fields.map(f => (
        <Field key={f.key} label={f.label} value={cfg[f.key] ?? ''} onChange={v => setCfg(c => ({ ...c, [f.key]: v }))} placeholder={f.placeholder} rows={f.key === 'termosUsoHtml' ? 16 : 8} />
      ))}
      <button type="button" onClick={salvar} disabled={saving} className="inline-flex items-center gap-2 px-6 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#FF6B9D,#FF4D8D)' }}>
        <Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar textos de Envios'}
      </button>
    </div>
  )
}
