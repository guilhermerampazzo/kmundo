'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Settings, Save, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseValorMoeda } from '@/lib/moeda'

interface Configuracao {
  id: string
  diasGratuitos: number
  taxaDiariaArmazem: number
  moedaTaxa: string
  nomeEmpresa: string
  emailContato: string | null
  whatsappRecepcao: string | null
  chavePix: string | null
  qrCodePix: string | null
  instrucoesPix: string | null
  wiseLink: string | null
  koreanBankName: string | null
  koreanBankAccount: string | null
  koreanBankHolder: string | null
  precoFotoVideo?: number | null
  precoFoto: number
  precoVideo: number
  precoMedicao: number
  precoReembalagem: number
  precoOutro: number
}

interface Props {
  config: Configuracao
  blingConectado: boolean
}

export function ConfiguracoesForm({ config, blingConectado }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nomeEmpresa: config.nomeEmpresa,
    emailContato: config.emailContato ?? '',
    whatsappRecepcao: config.whatsappRecepcao ?? '',
    chavePix: config.chavePix ?? '',
    qrCodePix: config.qrCodePix ?? '',
    instrucoesPix: config.instrucoesPix ?? '',
    wiseLink: (config as unknown as { wiseLink?: string | null }).wiseLink ?? '',
    koreanBankName: (config as unknown as { koreanBankName?: string | null }).koreanBankName ?? '',
    koreanBankAccount: (config as unknown as { koreanBankAccount?: string | null }).koreanBankAccount ?? '',
    koreanBankHolder: (config as unknown as { koreanBankHolder?: string | null }).koreanBankHolder ?? '',
    diasGratuitos: String(config.diasGratuitos),
    taxaDiariaArmazem: String(config.taxaDiariaArmazem),
    moedaTaxa: config.moedaTaxa,
    precoFoto: String((config as unknown as { precoFoto?: number }).precoFoto ?? config.precoFotoVideo ?? 0),
    precoVideo: String((config as unknown as { precoVideo?: number }).precoVideo ?? config.precoFotoVideo ?? 0),
    precoMedicao: String(config.precoMedicao ?? 0),
    precoReembalagem: String(config.precoReembalagem ?? 0),
    precoOutro: String(config.precoOutro ?? 0),
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeEmpresa: form.nomeEmpresa,
          emailContato: form.emailContato || null,
          whatsappRecepcao: form.whatsappRecepcao || null,
          chavePix: form.chavePix || null,
          qrCodePix: form.qrCodePix || null,
          instrucoesPix: form.instrucoesPix || null,
          wiseLink: form.wiseLink || null,
          koreanBankName: form.koreanBankName || null,
          koreanBankAccount: form.koreanBankAccount || null,
          koreanBankHolder: form.koreanBankHolder || null,
          diasGratuitos: parseInt(form.diasGratuitos),
          taxaDiariaArmazem: parseValorMoeda(form.taxaDiariaArmazem, form.moedaTaxa),
          moedaTaxa: form.moedaTaxa,
          precoFoto: parseValorMoeda(form.precoFoto, form.moedaTaxa),
          precoVideo: parseValorMoeda(form.precoVideo, form.moedaTaxa),
          precoMedicao: parseValorMoeda(form.precoMedicao, form.moedaTaxa),
          precoReembalagem: parseValorMoeda(form.precoReembalagem, form.moedaTaxa),
          precoOutro: parseValorMoeda(form.precoOutro, form.moedaTaxa),
        }),
      })
      if (res.ok) {
        toast.success('Configurações salvas com sucesso!')
        router.refresh()
      } else {
        const json = await res.json() as { error?: string }
        toast.error(json.error ?? 'Erro ao salvar')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1A2E' }}>
          <Settings className="w-4 h-4" style={{ color: '#FF6B9D' }} />
          Empresa
        </h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Nome da empresa</Label>
            <Input
              name="nomeEmpresa"
              value={form.nomeEmpresa}
              onChange={handleChange}
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Email de contato</Label>
            <Input
              name="emailContato"
              type="email"
              value={form.emailContato}
              onChange={handleChange}
              placeholder="contato@suitemanager.com"
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#1A1A2E' }}>
          <Link2 className="w-4 h-4" style={{ color: '#FF6B9D' }} />
          Integração Bling
        </h2>
        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{blingConectado ? 'Conta Bling conectada.' : 'Conecte a conta Bling para emitir notas fiscais.'}</p>
        <a href="/api/bling/conectar" className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-semibold text-white" style={{ background: '#1A1A2E' }}>
          <Link2 className="w-4 h-4" />
          {blingConectado ? 'Reconectar Bling' : 'Conectar Bling'}
        </a>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Pagamentos e Contato</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>WhatsApp da recepção</Label>
            <Input
              name="whatsappRecepcao"
              value={form.whatsappRecepcao}
              onChange={handleChange}
              placeholder="5511999999999"
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Número usado no botão de pagamento em cartão via WhatsApp</p>
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Chave Pix fixa</Label>
            <Input
              name="chavePix"
              value={form.chavePix}
              onChange={handleChange}
              placeholder="email, telefone, CPF/CNPJ ou chave aleatória"
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Imagem/URL do QR Code Pix</Label>
            <Input
              name="qrCodePix"
              value={form.qrCodePix}
              onChange={handleChange}
              placeholder="https://... ou /uploads/..."
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Instruções do Pix</Label>
            <textarea
              name="instrucoesPix"
              value={form.instrucoesPix}
              onChange={handleChange}
              rows={3}
              placeholder="Texto complementar exibido para o cliente"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1.5 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Pagamento Internacional (Wise / Banco Coreano)</h2>
        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Exibido no card Information do cliente (Payment). Deixe em branco para ocultar.</p>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Wise Quick Link</Label>
            <Input name="wiseLink" value={form.wiseLink} onChange={handleChange} placeholder="https://wise.com/pay/..." className="h-11 mt-1.5" style={{ borderRadius: '8px' }} />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Banco — Nome</Label>
            <Input name="koreanBankName" value={form.koreanBankName} onChange={handleChange} placeholder="Kookmin Bank" className="h-11 mt-1.5" style={{ borderRadius: '8px' }} />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Banco — Número da conta</Label>
            <Input name="koreanBankAccount" value={form.koreanBankAccount} onChange={handleChange} placeholder="469301-01-213906" className="h-11 mt-1.5" style={{ borderRadius: '8px' }} />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Banco — Titular</Label>
            <Input name="koreanBankHolder" value={form.koreanBankHolder} onChange={handleChange} placeholder="Hwa Jiwook" className="h-11 mt-1.5" style={{ borderRadius: '8px' }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Armazenagem</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Dias gratuitos</Label>
            <Input
              name="diasGratuitos"
              type="number"
              min="0"
              value={form.diasGratuitos}
              onChange={handleChange}
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Período sem cobrança</p>
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Taxa diária</Label>
            <Input
              name="taxaDiariaArmazem"
              type="text"
              inputMode="decimal"
              value={form.taxaDiariaArmazem}
              onChange={handleChange}
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Após o período gratuito</p>
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Moeda</Label>
            <select
              name="moedaTaxa"
              value={form.moedaTaxa}
              onChange={handleChange}
              className="w-full h-11 mt-1.5 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderRadius: '8px', borderColor: '#E5E7EB', color: '#1A1A2E' }}
            >
              <option value="USD">USD</option>
              <option value="KRW">KRW</option>
              <option value="BRL">BRL</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Preços dos serviços</h2>
        <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>Valores exibidos ao cliente na solicitação de serviços (na moeda acima). Para KRW digite só números sem ponto: 50000 para 50 mil. Para BRL use vírgula nos centavos: 460,00.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Foto</Label>
            <Input
              name="precoFoto"
              type="text"
              inputMode="decimal"
              value={form.precoFoto}
              onChange={handleChange}
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Vídeo</Label>
            <Input
              name="precoVideo"
              type="text"
              inputMode="decimal"
              value={form.precoVideo}
              onChange={handleChange}
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Peso e tamanho</Label>
            <Input
              name="precoMedicao"
              type="text"
              inputMode="decimal"
              value={form.precoMedicao}
              onChange={handleChange}
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Reembalagem</Label>
            <Input
              name="precoReembalagem"
              type="text"
              inputMode="decimal"
              value={form.precoReembalagem}
              onChange={handleChange}
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Outro</Label>
            <Input
              name="precoOutro"
              type="text"
              inputMode="decimal"
              value={form.precoOutro}
              onChange={handleChange}
              className="h-11 mt-1.5"
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 font-semibold text-white rounded-xl"
        style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF4D8D)', borderRadius: '10px' }}
      >
        <Save className="w-4 h-4" />
        {saving ? 'Salvando...' : 'Salvar configurações'}
      </Button>
    </form>
  )
}
