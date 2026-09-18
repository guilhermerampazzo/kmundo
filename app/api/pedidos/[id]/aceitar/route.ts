import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'

export const dynamic = 'force-dynamic'

// Cliente aceita a cotação -> AGUARDANDO_PAGAMENTO
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pedido = await prisma.pedidoCompra.findUnique({ where: { id: params.id } })
  if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  if (session.user.role !== 'ADMIN') {
    const cliente = await prisma.cliente.findFirst({ where: clienteWhereFromSession(session.user) })
    if (!cliente || pedido.clienteId !== cliente.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  if (!['COTACAO_DISPONIVEL', 'AGUARDANDO_CONFIRMACAO_CLIENTE'].includes(pedido.status)) {
    return NextResponse.json({ error: 'Este pedido não está aguardando sua confirmação' }, { status: 400 })
  }

  const atualizado = await prisma.pedidoCompra.update({
    where: { id: pedido.id },
    data: { status: 'AGUARDANDO_PAGAMENTO' },
  })
  return NextResponse.json({ ok: true, status: atualizado.status })
}
