'use client'

import { Flag, Mail, CheckCircle2 } from 'lucide-react'

type Props = {
  email: string
  kcoinFee: number
  moedaFee: string
  wiseLink?: string | null
  koreanBank?: { name?: string | null; account?: string | null; holder?: string | null } | null
}

function fmt(valor: number, moeda: string) {
  if (moeda === 'KRW') return `${Math.round(valor).toLocaleString('en-US')} ${moeda}`
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${moeda}`
}

export function KCoinInformationCard({ email, kcoinFee, moedaFee }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-5 h-5" style={{ color: '#EF4444' }} />
          <h2 className="font-bold" style={{ color: '#1A1A2E' }}>Information</h2>
        </div>
        <div className="border-t border-dashed pt-4 space-y-2 text-sm" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-2">
            <span style={{ color: '#374151' }}>→</span>
            <span className="font-bold" style={{ color: '#1A1A2E' }}>Serviços a pagar:</span>
            <span style={{ color: kcoinFee > 0 ? '#DC2626' : '#16A34A' }}>{fmt(kcoinFee, moedaFee)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" style={{ color: '#6B7280' }} />
            <span className="font-bold" style={{ color: '#1A1A2E' }}>Email:</span>
            <span style={{ color: '#6B7280' }}>{email}</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#16A34A' }}>
              <CheckCircle2 className="w-4 h-4" /> ok
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ background: '#22C55E', color: 'white' }}>✓</span>
          <h3 className="font-bold" style={{ color: '#1A1A2E' }}>important</h3>
        </div>
        <div className="space-y-2 text-sm leading-relaxed" style={{ color: '#6B7280' }}>
          <p>
            Os valores pagos referentes às taxas de serviço não são reembolsáveis após a realização do serviço, independentemente da situação. Cada serviço realizado é devidamente registrado e comprovado por meio de fotos e/ou vídeos, conforme o serviço contratado.
          </p>
        </div>
      </div>
    </div>
  )
}
