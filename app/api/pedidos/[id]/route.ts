import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import { atualizarPedidoCompraAdminSchema } from '@/lib/validations/pedido-compra'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pedido = await prisma.pedidoCompra.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, nomeCompleto: true, numeroDeSuite: true } },
      itens: true,
    },
  })

  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  if (session.user.role !== 'ADMIN') {
    const cliente = await prisma.cliente.findFirst({ where: clienteWhereFromSession(session.user) })
    if (!cliente || pedido.clienteId !== cliente.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
  }

  return NextResponse.json(pedido)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pedido = await prisma.pedidoCompra.findUnique({ where: { id: params.id } })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  await prisma.pedidoCompra.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pedido = await prisma.pedidoCompra.findUnique({ where: { id: params.id } })
  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = atualizarPedidoCompraAdminSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten(), message: 'Dados inválidos para atualizar pedido' }, { status: 400 })
  }

  const data: Record<string, unknown> = {
    ...parsed.data,
    linkCartao: parsed.data.linkCartao || null,
  }

  if (parsed.data.dataLimitePagamento) {
    data.dataLimitePagamento = new Date(parsed.data.dataLimitePagamento)
  }

  if (parsed.data.pagoEm) {
    data.pagoEm = new Date(parsed.data.pagoEm)
  }
  if (parsed.data.comprovanteEnviadoEm) data.comprovanteEnviadoEm = new Date(parsed.data.comprovanteEnviadoEm)
  if (parsed.data.comprovanteConfirmadoEm) data.comprovanteConfirmadoEm = new Date(parsed.data.comprovanteConfirmadoEm)
  // Auto preencher confirmadoEm quando admin marca PAGAMENTO_FEITO/COMPRADO (ou legados PAGO)
  if (parsed.data.status === 'PAGAMENTO_FEITO' || parsed.data.status === 'PAGO' || parsed.data.status === 'COMPRADO') {
    if (!pedido.comprovanteConfirmadoEm) data.comprovanteConfirmadoEm = new Date()
    if (!pedido.pagoEm) data.pagoEm = new Date()
  }

  const atualizado = await prisma.pedidoCompra.update({
    where: { id: params.id },
    data,
    include: {
      cliente: { select: { id: true, nomeCompleto: true, numeroDeSuite: true } },
      itens: true,
    },
  })

  return NextResponse.json(atualizado)
}
