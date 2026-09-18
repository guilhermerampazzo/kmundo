'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Trash2, ShoppingBag, Upload, X } from 'lucide-react'

const MAX_FOTOS_ITEM = 5

type ItemForm = {
  nomeProduto: string
  urlProduto: string
  quantidade: string
  variacao: string
  observacoes: string
  fotoUrls: string[]
}

const itemVazio = (): ItemForm => ({
  nomeProduto: '',
  urlProduto: '',
  quantidade: '1',
  variacao: '',
  observacoes: '',
  fotoUrls: [],
})

export function PedidoCompraForm() {
  const router = useRouter()
  const [itens, setItens] = useState<ItemForm[]>([itemVazio()])
  const [observacoesCliente, setObservacoesCliente] = useState('')
  const [formaPagamentoCliente, setFormaPagamentoCliente] = useState<'PIX' | 'CARTAO_WHATSAPP'>('PIX')
  const [salvando, setSalvando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState<number | null>(null)

  function atualizarItem(index: number, campo: keyof ItemForm, valor: string | string[]) {
    setItens((prev) => prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)))
  }

  async function uploadFotos(index: number, files: FileList | null) {
    if (!files?.length) return
    const atuais = itens[index].fotoUrls
    const novas = Array.from(files).slice(0, MAX_FOTOS_ITEM - atuais.length)
    if (novas.length === 0) {
      toast.error(`Máximo de ${MAX_FOTOS_ITEM} fotos por produto`)
      return
    }
    setEnviandoFoto(index)
    try {
      const data = new FormData()
      novas.forEach(f => data.append('files', f))
      const res = await fetch('/api/uploads/operacional', { method: 'POST', body: data })
      if (!res.ok) throw new Error('Falha no upload das fotos')
      const json = await res.json() as { urls: string[] }
      atualizarItem(index, 'fotoUrls', [...atuais, ...json.urls].slice(0, MAX_FOTOS_ITEM))
    } catch {
      toast.error('Não foi possível enviar as fotos')
    } finally {
      setEnviandoFoto(null)
    }
  }

  function removerFoto(index: number, url: string) {
    atualizarItem(index, 'fotoUrls', itens[index].fotoUrls.filter(u => u !== url))
  }

  function adicionarItem() {
    setItens((prev) => [...prev, itemVazio()])
  }

  function removerItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index))
  }

  async function salvar() {
    const itensValidos = itens
      .map((item) => ({
        nomeProduto: item.nomeProduto.trim(),
        urlProduto: item.urlProduto.trim(),
        quantidade: Number(item.quantidade) || 1,
        variacao: item.variacao.trim(),
        observacoes: item.observacoes.trim(),
        fotoUrls: item.fotoUrls,
      }))
      .filter((item) => item.nomeProduto)

    if (itensValidos.length === 0) {
      toast.error('Adicione ao menos um produto ao pedido.')
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: itensValidos,
          observacoesCliente: observacoesCliente.trim() || undefined,
          formaPagamentoCliente,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.message ?? json.error ?? 'Erro ao criar pedido.')
        return
      }

      toast.success('Pedido criado com sucesso!')
      router.push(`/meus-pedidos/${json.id}`)
      router.refresh()
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      {itens.map((item, index) => (
        <div key={index} className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: '#1A1A2E' }}>
              <ShoppingBag className="w-4 h-4" style={{ color: '#FF6B9D' }} />
              Produto {index + 1}
            </h2>
            {itens.length > 1 && (
              <button type="button" onClick={() => removerItem(index)} className="text-sm flex items-center gap-1" style={{ color: '#EF4444' }}>
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium" style={{ color: '#374151' }}>Nome do produto *</Label>
              <Input value={item.nomeProduto} onChange={(e) => atualizarItem(index, 'nomeProduto', e.target.value)} className="h-11 mt-1.5" style={{ borderRadius: '8px' }} />
            </div>
            <div>
              <Label className="text-sm font-medium" style={{ color: '#374151' }}>Link do produto</Label>
              <Input value={item.urlProduto} onChange={(e) => atualizarItem(index, 'urlProduto', e.target.value)} placeholder="https://..." className="h-11 mt-1.5" style={{ borderRadius: '8px' }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium" style={{ color: '#374151' }}>Quantidade</Label>
                <Input type="number" min="1" value={item.quantidade} onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)} className="h-11 mt-1.5" style={{ borderRadius: '8px' }} />
              </div>
              <div>
                <Label className="text-sm font-medium" style={{ color: '#374151' }}>Variação</Label>
                <Input value={item.variacao} onChange={(e) => atualizarItem(index, 'variacao', e.target.value)} placeholder="Cor, tamanho, opção..." className="h-11 mt-1.5" style={{ borderRadius: '8px' }} />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium" style={{ color: '#374151' }}>Observações do item</Label>
              <textarea value={item.observacoes} onChange={(e) => atualizarItem(index, 'observacoes', e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1.5 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ borderRadius: '8px' }} />
            </div>
            <div>
              <Label className="text-sm font-medium" style={{ color: '#374151' }}>Fotos do produto (opcional, até {MAX_FOTOS_ITEM})</Label>
              <label className="mt-1.5 h-11 rounded-lg border border-dashed border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer" style={{ borderRadius: '8px' }}>
                <Upload className="w-4 h-4" style={{ color: '#FF6B9D' }} />
                <span style={{ color: '#6B7280' }}>{enviandoFoto === index ? 'Enviando...' : item.fotoUrls.length > 0 ? `${item.fotoUrls.length} foto(s) adicionada(s) — clique para adicionar mais` : 'Adicionar foto do produto'}</span>
                <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => uploadFotos(index, e.target.files)} />
              </label>
              {item.fotoUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.fotoUrls.map((url) => (
                    <div key={url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Produto" className="w-16 h-16 rounded-lg object-cover border" style={{ borderColor: '#E5E7EB' }} />
                      <button type="button" onClick={() => removerFoto(index, url)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: '#EF4444' }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={adicionarItem} className="w-full h-11 flex items-center gap-2" style={{ borderRadius: '10px' }}>
        <Plus className="w-4 h-4" />
        Adicionar outro produto
      </Button>

      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 className="font-semibold mb-4" style={{ color: '#1A1A2E' }}>Pagamento e observações</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Forma de pagamento preferida</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button type="button" onClick={() => setFormaPagamentoCliente('PIX')} className="px-4 py-3 rounded-xl border-2 text-sm font-medium" style={{ borderColor: formaPagamentoCliente === 'PIX' ? '#FF6B9D' : '#E5E7EB', color: formaPagamentoCliente === 'PIX' ? '#FF6B9D' : '#6B7280', background: formaPagamentoCliente === 'PIX' ? '#FFF1F5' : 'white' }}>
                Pix
              </button>
              <button type="button" onClick={() => setFormaPagamentoCliente('CARTAO_WHATSAPP')} className="px-4 py-3 rounded-xl border-2 text-sm font-medium" style={{ borderColor: formaPagamentoCliente === 'CARTAO_WHATSAPP' ? '#FF6B9D' : '#E5E7EB', color: formaPagamentoCliente === 'CARTAO_WHATSAPP' ? '#FF6B9D' : '#6B7280', background: formaPagamentoCliente === 'CARTAO_WHATSAPP' ? '#FFF1F5' : 'white' }}>
                Cartão parcelado
              </button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: '#374151' }}>Observações gerais</Label>
            <textarea value={observacoesCliente} onChange={(e) => setObservacoesCliente(e.target.value)} rows={4} placeholder="Algum detalhe importante para a equipe comprar seu pedido" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1.5 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ borderRadius: '8px' }} />
          </div>
        </div>
      </div>

      <Button type="button" onClick={salvar} disabled={salvando} className="w-full h-12 font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF4D8D)', borderRadius: '12px' }}>
        {salvando ? 'Enviando pedido...' : 'Enviar pedido de compra'}
      </Button>
    </div>
  )
}
