import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import { criarEnvioSchema } from '@/lib/validations/envio'
import { notificarAdminNovoEnvio, notificarClienteEnvioSolicitado } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const cliente = await prisma.cliente.findFirst({
    where: clienteWhereFromSession(session.user),
  })
  if (!cliente) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = criarEnvioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { metodoEnvio, valorDeclaradoTexto, enderecoCompleto, usarEnderecoCoreano, enderecoCoreano, telefoneCoreano } = parsed.data
  const itemIds = parsed.data.itemIds ?? []
  const caixaIds = parsed.data.caixaIds ?? []

  // Verificar que os itens pertencem ao cliente
  const itens = itemIds.length > 0 ? await prisma.item.findMany({
    where: { id: { in: itemIds }, clienteId: cliente.id },
  }) : []
  if (itens.length !== itemIds.length) {
    return NextResponse.json({ error: 'Um ou mais itens inválidos' }, { status: 400 })
  }

  // Verificar que as caixas pertencem ao cliente
  const caixas = caixaIds.length > 0 ? await prisma.caixaRecebida.findMany({
    where: { id: { in: caixaIds }, clienteId: cliente.id },
  }) : []
  if (caixas.length !== caixaIds.length) {
    return NextResponse.json({ error: 'Uma ou mais caixas inválidas' }, { status: 400 })
  }

  // Bloquear envio se houver serviços pendentes (caixinha acumula)
  const pendencia = await prisma.cobranca.findFirst({
    where: {
      clienteId: cliente.id,
      solicitacaoId: { not: null },
      status: { in: ['PENDENTE', 'COMPROVANTE_ENVIADO'] },
    },
  })
  if (pendencia) {
    return NextResponse.json(
      { error: 'Você possui serviços pendentes. Regularize o pagamento em Financeiro (ou pague junto com o frete) antes de solicitar novo envio.' },
      { status: 403 }
    )
  }

  const envio = await prisma.envio.create({
    data: {
      clienteId: cliente.id,
      metodoEnvio,
      valorDeclaradoTexto: valorDeclaradoTexto || null,
      enderecoCompleto,
      usarEnderecoCoreano: !!usarEnderecoCoreano,
      enderecoCoreano: enderecoCoreano || null,
      telefoneCoreano: telefoneCoreano || null,
      aceitouTermos: true,
      aceitouTermosEm: new Date(),
      // compat: manter declaracaoConteudo espelhando valorDeclaradoTexto para legado
      declaracaoConteudo: valorDeclaradoTexto || null,
      status: 'AGUARDANDO_CONFIRMACAO',
      itens: {
        create: itemIds.map((itemId) => ({ itemId })),
      },
      caixas: {
        create: caixaIds.map((caixaId) => ({ caixaId })),
      },
    },
    include: {
      itens: { include: { item: true } },
      caixas: { include: { caixa: true } },
      cliente: { include: { usuario: { select: { email: true } } } },
    },
  })

  const emailCliente = envio.cliente.usuario.email
  const nomeCliente = envio.cliente.nomeCompleto
  const suite = envio.cliente.numeroDeSuite
  const nomesItens = [...envio.itens.map(i => i.item.descricao), ...envio.caixas.map(c => `Caixa ${c.caixa.tracking}`)]

  Promise.all([
    notificarAdminNovoEnvio({ nomeCliente, suite, metodo: metodoEnvio, itens: nomesItens, envioId: envio.id }),
    notificarClienteEnvioSolicitado({ emailCliente, nomeCliente, suite, metodo: metodoEnvio, itens: nomesItens, envioId: envio.id }),
  ]).catch(console.error)

  return NextResponse.json(envio, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const metodo = searchParams.get('metodo')

  const where: Record<string, unknown> = {}

  if (session.user.role === 'CLIENTE') {
    const cliente = await prisma.cliente.findFirst({
      where: clienteWhereFromSession(session.user),
    })
    if (!cliente) return NextResponse.json([])
    where['clienteId'] = cliente.id
  }

  if (status) where['status'] = status
  if (metodo) where['metodoEnvio'] = metodo

  const envios = await prisma.envio.findMany({
    where,
    include: {
      cliente: { select: { nomeCompleto: true, numeroDeSuite: true } },
      itens: { include: { item: { select: { id: true, descricao: true, status: true } } } },
      caixas: { include: { caixa: { select: { id: true, tracking: true, lojaOrigem: true, status: true } } } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(envios)
}
