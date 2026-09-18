import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const configSchema = z.object({
  diasGratuitos: z.number().int().min(0).optional(),
  taxaDiariaArmazem: z.number().min(0).optional(),
  moedaTaxa: z.string().min(1).optional(),
  precoUnboxing: z.number().min(0).optional(),
  precoFotoVideo: z.number().min(0).optional(),
  precoFoto: z.number().min(0).optional(),
  precoVideo: z.number().min(0).optional(),
  precoMedicao: z.number().min(0).optional(),
  precoReembalagem: z.number().min(0).optional(),
  precoOutro: z.number().min(0).optional(),
  nomeEmpresa: z.string().min(1).optional(),
  emailContato: z.string().email().optional().nullable(),
  whatsappRecepcao: z.string().optional().nullable(),
  chavePix: z.string().optional().nullable(),
  qrCodePix: z.string().optional().nullable(),
  instrucoesPix: z.string().optional().nullable(),
  wiseLink: z.string().optional().nullable(),
  koreanBankName: z.string().optional().nullable(),
  koreanBankAccount: z.string().optional().nullable(),
  koreanBankHolder: z.string().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let config = await prisma.configuracao.findFirst()
  if (!config) {
    config = await prisma.configuracao.create({ data: {} })
  }

  return NextResponse.json(config)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = configSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  let config = await prisma.configuracao.findFirst()

  if (config) {
    config = await prisma.configuracao.update({
      where: { id: config.id },
      data: parsed.data,
    })
  } else {
    config = await prisma.configuracao.create({ data: parsed.data })
  }

  return NextResponse.json(config)
}
