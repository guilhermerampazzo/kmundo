import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'

export const dynamic = 'force-dynamic'

// Cliente cancela a solicitação -> CANCELADO
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pedido = await prisma.pedidoCompra.findUnique({ where: { id: params.id } })
  if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  if (session.user.role !== 'ADMIN') {
    const cliente = await prisma.cliente.findFirst({ where: clienteWhereFromSession(session.user) })
    if (!cliente || pedido.clienteId !== cliente.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  if (['COMPRADO', 'CANCELADO'].includes(pedido.status)) {
    return NextResponse.json({ error: 'Este pedido já foi encerrado' }, { status: 400 })
  }

  const atualizado = await prisma.pedidoCompra.update({
    where: { id: pedido.id },
    data: { status: 'CANCELADO' },
  })
  return NextResponse.json({ ok: true, status: atualizado.status })
}
