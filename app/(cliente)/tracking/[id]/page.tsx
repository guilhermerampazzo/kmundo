import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PackageSearch, Clock, CheckCircle, Image as ImageIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TrackingDetalhePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) notFound()
  const cliente = await prisma.cliente.findFirst({ where: clienteWhereFromSession(session.user) })
  if (!cliente) notFound()

  const caixa = await prisma.caixaRecebida.findFirst({
    where: { id: params.id, clienteId: cliente.id },
  })
  if (!caixa) notFound()

  const pendente = caixa.status === 'PENDENTE'

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link href="/tracking" className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-70" style={{ color: '#FF6B9D' }}>
        <ArrowLeft className="w-4 h-4" />Voltar para Tracking
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>Caixa {caixa.tracking}</h1>
          <p className="text-sm mt-1 flex items-center gap-2" style={{ color: '#6B7280' }}>
            <Clock className="w-4 h-4" />Registrada em {new Date(caixa.criadoEm).toLocaleString('pt-BR')}
          </p>
        </div>
        {pendente ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100" style={{ color: '#92400E' }}>
            A caminho
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100" style={{ color: '#047857' }}>
            <CheckCircle className="w-3 h-3" />Recebida no armazém
          </span>
        )}
      </div>

      {/* Etapas */}
      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1A2E' }}>
          <PackageSearch className="w-4 h-4" style={{ color: '#FF6B9D' }} /> Etapas
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#FFF1F5', color: '#FF6B9D' }}>1</div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#1A1A2E' }}>A caminho</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Você cadastrou o tracking. A caixa está a caminho do armazém.</p>
            </div>
            <CheckCircle className="w-5 h-5 ml-auto" style={{ color: '#22C55E' }} />
          </div>
          <div className="flex items-center gap-3" style={{ opacity: pendente ? 0.4 : 1 }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: pendente ? '#F3F4F6' : '#F0FDF4', color: pendente ? '#9CA3AF' : '#22C55E' }}>2</div>
            <div>
              <p className="text-sm font-medium" style={{ color: pendente ? '#9CA3AF' : '#1A1A2E' }}>Recebida no armazém</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{pendente ? 'Aguardando confirmação da administração' : `Recebida em ${caixa.recebidoEm ? new Date(caixa.recebidoEm).toLocaleString('pt-BR') : ''}`}</p>
            </div>
            {!pendente && <CheckCircle className="w-5 h-5 ml-auto" style={{ color: '#22C55E' }} />}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Detalhes da caixa</h2>
        <div className="space-y-3 text-sm">
          <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Tracking</p><p className="font-mono font-medium" style={{ color: '#1A1A2E' }}>{caixa.tracking}</p></div>
          {caixa.lojaOrigem && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Loja de origem</p><p style={{ color: '#374151' }}>{caixa.lojaOrigem}</p></div>}
          {caixa.observacoes && <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Observações</p><p style={{ color: '#374151' }}>{caixa.observacoes}</p></div>}
          <div><p className="text-xs" style={{ color: '#9CA3AF' }}>Comprovante da compra</p><a href={caixa.comprovanteCompraUrl} target="_blank" rel="noreferrer" className="inline-block mt-1 rounded bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200">Ver comprovante</a></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1A1A2E' }}><ImageIcon className="w-4 h-4" style={{ color: '#FF6B9D' }} /> Fotos da etiqueta</h2>
        {((caixa as { fotoEtiquetaUrls?: string[] }).fotoEtiquetaUrls && (caixa as { fotoEtiquetaUrls?: string[] }).fotoEtiquetaUrls!.length > 0) || caixa.fotoEtiquetaUrl ? (
          <div>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Clique na miniatura para ver em tamanho maior:</p>
            <div className="flex flex-wrap gap-3">
              {((caixa as { fotoEtiquetaUrls?: string[] }).fotoEtiquetaUrls && (caixa as { fotoEtiquetaUrls?: string[] }).fotoEtiquetaUrls!.length > 0 ? (caixa as { fotoEtiquetaUrls?: string[] }).fotoEtiquetaUrls! : [caixa.fotoEtiquetaUrl!]).map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Foto da etiqueta" className="w-32 h-32 rounded-xl object-cover border hover:opacity-90 transition-opacity cursor-pointer" style={{ borderColor: '#E5E7EB' }} />
                </a>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: '#22C55E' }}>✓ Etiqueta vinculada — confirma que sua caixa chegou ao armazém.</p>
          </div>
        ) : (
          <div className="rounded-xl p-4 text-center" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-sm" style={{ color: '#92400E' }}>Nenhuma foto da etiqueta ainda.</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Ela aparecerá aqui após nossa equipe confirmar o recebimento no armazém.</p>
          </div>
        )}
      </div>
    </div>
  )
}
