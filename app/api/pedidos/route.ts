import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import { criarPedidoCompraSchema } from '@/lib/validations/pedido-compra'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const where: Record<string, unknown> = {}

  if (session.user.role === 'CLIENTE') {
    const cliente = await prisma.cliente.findFirst({
      where: clienteWhereFromSession(session.user),
    })

    if (!cliente) {
      return NextResponse.json([])
    }

    where['clienteId'] = cliente.id
  }

  const pedidos = await prisma.pedidoCompra.findMany({
    where,
    include: {
      cliente: { select: { id: true, nomeCompleto: true, numeroDeSuite: true } },
      itens: true,
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(pedidos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'CLIENTE') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const cliente = await prisma.cliente.findFirst({
    where: clienteWhereFromSession(session.user),
  })

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = criarPedidoCompraSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten(), message: 'Dados inválidos para criar pedido' }, { status: 400 })
  }

  const pedido = await prisma.pedidoCompra.create({
    data: {
      clienteId: cliente.id,
      observacoesCliente: parsed.data.observacoesCliente || undefined,
      formaPagamentoCliente: parsed.data.formaPagamentoCliente,
      itens: {
        create: parsed.data.itens.map((item) => ({
                  produtoShopId: item.produtoShopId || undefined,
                  nomeProduto: item.nomeProduto,
                  urlProduto: item.urlProduto || undefined,
                  quantidade: item.quantidade,
                  variacao: item.variacao || undefined,
                  observacoes: item.observacoes || undefined,
                  fotoUrls: item.fotoUrls ?? [],
                })),
      },
    },
    include: {
      cliente: { select: { id: true, nomeCompleto: true, numeroDeSuite: true } },
      itens: true,
    },
  })

  return NextResponse.json(pedido, { status: 201 })
}
