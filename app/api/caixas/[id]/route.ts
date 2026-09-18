import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notificarClienteCaixaRecebida } from '@/lib/email'

const confirmarSchema = z.object({
  status: z.literal('RECEBIDA'),
  fotoEtiquetaUrl: z.string().min(1, 'Foto da etiqueta obrigatória'),
  fotoEtiquetaUrls: z.array(z.string()).max(5).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const caixa = await prisma.caixaRecebida.findUnique({
    where: { id: params.id },
    include: { cliente: { include: { usuario: { select: { email: true } } } } },
  })
  if (!caixa) return NextResponse.json({ error: 'Caixa não encontrada' }, { status: 404 })

  const parsed = confirmarSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const atualizada = await prisma.caixaRecebida.update({
    where: { id: params.id },
    data: {
      status: 'RECEBIDA',
      fotoEtiquetaUrl: parsed.data.fotoEtiquetaUrl,
      fotoEtiquetaUrls: parsed.data.fotoEtiquetaUrls ?? [parsed.data.fotoEtiquetaUrl],
      recebidoEm: new Date(),
    },
  })

  // Notificar o cliente que a caixa chegou ao armazém
  if (caixa.status !== 'RECEBIDA') {
    notificarClienteCaixaRecebida({
      emailCliente: caixa.cliente.usuario.email,
      nomeCliente: caixa.cliente.nomeCompleto,
      suite: caixa.cliente.numeroDeSuite,
      tracking: caixa.tracking,
      caixaId: caixa.id,
      fotoEtiquetaUrl: parsed.data.fotoEtiquetaUrl,
    }).catch(console.error)
  }

  return NextResponse.json(atualizada)
}
