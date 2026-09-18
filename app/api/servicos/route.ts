import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clienteWhereFromSession } from '@/lib/cliente-session'
import { z } from 'zod'

const createSchema = z.object({ caixaId: z.string().optional(), tipo: z.enum(['FOTO', 'VIDEO', 'MEDICAO', 'REEMBALAGEM', 'OUTRO', 'UNBOXING', 'FOTO_VIDEO']), descricao: z.string().optional() })
const patchSchema = z.object({ status: z.enum(['SOLICITADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).optional(), fotoUrls: z.array(z.string().min(1)).max(10).optional(), videoUrl: z.string().min(1).optional(), peso: z.number().positive().optional(), largura: z.number().positive().optional(), altura: z.number().positive().optional(), comprimento: z.number().positive().optional(), descricao: z.string().optional(), observacoesEquipe: z.string().optional() })

async function clienteDaSessao(user: { id?: string | null; email?: string | null; numeroDeSuite?: number | null }) { return prisma.cliente.findFirst({ where: clienteWhereFromSession(user) }) }

export async function GET() {
  const session = await auth(); if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const cliente = session.user.role === 'CLIENTE' ? await clienteDaSessao(session.user) : null
  return NextResponse.json(await prisma.solicitacaoServico.findMany({ where: cliente ? { clienteId: cliente.id } : undefined, include: { caixa: { select: { tracking: true } }, cliente: { select: { nomeCompleto: true, numeroDeSuite: true } } }, orderBy: { criadoEm: 'desc' } }))
}

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const parsed = createSchema.safeParse(await req.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const cliente = await clienteDaSessao(session.user)
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  if (parsed.data.caixaId) { const caixa = await prisma.caixaRecebida.findFirst({ where: { id: parsed.data.caixaId, clienteId: cliente.id } }); if (!caixa) return NextResponse.json({ error: 'Caixa inválida' }, { status: 400 }) }

  const solicitacao = await prisma.solicitacaoServico.create({ data: { ...parsed.data, clienteId: cliente.id } })

  // Criar cobrança pendente automaticamente com preço da Config (se >0) — acumula na caixinha
  try {
    const config = await prisma.configuracao.findFirst()
    const precoMap: Record<string, number> = {
      FOTO: (config as unknown as { precoFoto?: number } | null)?.precoFoto ?? config?.precoFotoVideo ?? 0,
      VIDEO: (config as unknown as { precoVideo?: number } | null)?.precoVideo ?? config?.precoFotoVideo ?? 0,
      MEDICAO: config?.precoMedicao ?? 0,
      REEMBALAGEM: config?.precoReembalagem ?? 0,
      OUTRO: config?.precoOutro ?? 0,
      UNBOXING: config?.precoUnboxing ?? 0,
      FOTO_VIDEO: config?.precoFotoVideo ?? 0,
    }
    const valor = precoMap[parsed.data.tipo] ?? 0
    const moeda = config?.moedaTaxa ?? 'USD'
    if (valor > 0) {
      const caixa = parsed.data.caixaId ? await prisma.caixaRecebida.findUnique({ where: { id: parsed.data.caixaId } }) : null
      const descricao = `Serviço ${parsed.data.tipo.replaceAll('_', ' ')}${caixa ? ` | ${caixa.tracking}` : ''}`
      await prisma.cobranca.create({
        data: {
          clienteId: cliente.id,
          solicitacaoId: solicitacao.id,
          descricao,
          valor,
          moeda,
          status: 'PENDENTE',
        },
      })
    }
  } catch (e) {
    console.error('Falha ao criar cobrança de serviço', e)
  }

  return NextResponse.json(solicitacao, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await auth(); if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json() as { id?: string } & z.infer<typeof patchSchema>
  if (!body.id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const parsed = patchSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  return NextResponse.json(await prisma.solicitacaoServico.update({ where: { id: body.id }, data: { ...parsed.data, ...(parsed.data.status === 'CONCLUIDO' ? { concluidoEm: new Date() } : {}) } }))
}
