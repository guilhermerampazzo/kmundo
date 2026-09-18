import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import { z } from 'zod'
import { notificarAdminNovaCaixa } from '@/lib/email'

const createSchema = z.object({
  clienteId: z.string().cuid().optional(),
  tracking: z.string().min(3, 'Número de rastreamento obrigatório'),
  lojaOrigem: z.string().optional(),
  observacoes: z.string().optional(),
  comprovanteCompraUrl: z.string().min(1, 'Comprovante de compra obrigatório'),
  fotoEtiquetaUrl: z.string().optional(),
  fotoEtiquetaUrls: z.array(z.string()).max(5).optional().default([]),
  itemId: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const cliente = session.user.role === 'CLIENTE' ? await prisma.cliente.findFirst({ where: clienteWhereFromSession(session.user) }) : null
  return NextResponse.json(await prisma.caixaRecebida.findMany({
    where: cliente ? { clienteId: cliente.id } : undefined,
    include: { cliente: { select: { nomeCompleto: true, numeroDeSuite: true } }, item: true, solicitacoes: true },
    orderBy: { criadoEm: 'desc' },
  }))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Cliente registra caixa para si mesmo; admin pode registrar para qualquer cliente
  let clienteId = parsed.data.clienteId
  if (session.user.role === 'CLIENTE') {
    const cliente = await prisma.cliente.findFirst({ where: clienteWhereFromSession(session.user) })
    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    clienteId = cliente.id
  }
  if (!clienteId) return NextResponse.json({ error: 'Cliente obrigatório' }, { status: 400 })

  try {
    const caixa = await prisma.caixaRecebida.create({
      data: {
        clienteId,
        tracking: parsed.data.tracking.trim(),
        lojaOrigem: parsed.data.lojaOrigem?.trim() || undefined,
        observacoes: parsed.data.observacoes?.trim() || undefined,
        comprovanteCompraUrl: parsed.data.comprovanteCompraUrl,
        fotoEtiquetaUrl: parsed.data.fotoEtiquetaUrl?.trim() || parsed.data.fotoEtiquetaUrls?.[0] || undefined,
        fotoEtiquetaUrls: parsed.data.fotoEtiquetaUrls ?? (parsed.data.fotoEtiquetaUrl ? [parsed.data.fotoEtiquetaUrl] : []),
        itemId: parsed.data.itemId,
        status: 'PENDENTE',
      },
      include: { cliente: { include: { usuario: { select: { email: true } } } } },
    })

    // Notificar a equipe quando o cliente registra uma nova caixa
    if (session.user.role === 'CLIENTE') {
      notificarAdminNovaCaixa({
        nomeCliente: caixa.cliente.nomeCompleto,
        suite: caixa.cliente.numeroDeSuite,
        tracking: caixa.tracking,
        lojaOrigem: caixa.lojaOrigem,
        caixaId: caixa.id,
      }).catch(console.error)
    }

    return NextResponse.json(caixa, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Já existe uma caixa com este rastreamento para esta suíte' }, { status: 409 })
  }
}
