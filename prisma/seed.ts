import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Configuração padrão
  const configuracao = await prisma.configuracao.upsert({
    where: { id: 'config-default' },
    update: {},
    create: {
      id: 'config-default',
      diasGratuitos: 30,
      taxaDiariaArmazem: 0,
      moedaTaxa: 'USD',
      precoUnboxing: 0,
      precoFotoVideo: 0,
      precoFoto: 0,
      precoVideo: 0,
      precoMedicao: 0,
      precoReembalagem: 0,
      precoOutro: 0,
      nomeEmpresa: 'KMundo Warehouse',
      emailContato: process.env.ADMIN_EMAIL ?? 'contato@kmundowarehouse.com',
    },
  })
  console.log('✅ Configuração criada:', configuracao.nomeEmpresa)

  // Admin
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@kmundowarehouse.com'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123'
  const adminHash = await hash(adminPassword, 12)

  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      senha: adminHash,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin criado:', admin.email)

  // Produtos do Personal Shopper (idempotente: só cria se o nome não existir)
  const produtosShop = [
    { nome: 'Álbum BTS Proof (Standard)', descricao: 'Álbum oficial do BTS com photobook, livro de letras e fotos. Edição standard, lacrada.', categoria: 'Álbuns', precoEstimado: 45000, moeda: 'KRW', urlProduto: 'https://weverse.io/bts', ordem: 1 },
    { nome: 'Álbum NewJeans — Get Up (Bag Version)', descricao: 'Álbum do NewJeans com pôster, adesivos e cards exclusivos.', categoria: 'Álbuns', precoEstimado: 32000, moeda: 'KRW', urlProduto: 'https://weverse.io/newjeans', ordem: 2 },
    { nome: 'Máscara facial hidratante (pote)', descricao: 'Máscara coreana de hidratação profunda com niacinamida, uso noturno.', categoria: 'Maquiagem', precoEstimado: 28000, moeda: 'KRW', urlProduto: 'https://www.oliveyoung.co.kr', ordem: 3 },
    { nome: 'Base líquida cobertura média', descricao: 'Base coreana com viço natural, tom médio, 30ml.', categoria: 'Maquiagem', precoEstimado: 35000, moeda: 'KRW', urlProduto: 'https://www.oliveyoung.co.kr', ordem: 4 },
    { nome: 'Toner de arroz com extrato fermentado', descricao: 'Toner clareador com extrato de arroz fermentado, ideal para pele sensível.', categoria: 'Skincare', precoEstimado: 22000, moeda: 'KRW', urlProduto: 'https://www.oliveyoung.co.kr', ordem: 5 },
    { nome: 'Protetor solar coreano SPF50+ PA++++', descricao: 'Protetor solar leve com acabamento glow, sem white cast.', categoria: 'Skincare', precoEstimado: 18000, moeda: 'KRW', urlProduto: 'https://www.oliveyoung.co.kr', ordem: 6 },
    { nome: 'Blusa oversized com mangas bufantes', descricao: 'Blusa feminina estilo coreano, tecido leve, tamanho único.', categoria: 'Roupas', precoEstimado: 42000, moeda: 'KRW', urlProduto: 'https://www.musinsa.com', ordem: 7 },
    { nome: 'Cardigan tricot cropped', descricao: 'Cardigan curto de tricô, cores pastel, estilo K-fashion.', categoria: 'Roupas', precoEstimado: 56000, moeda: 'KRW', urlProduto: 'https://www.musinsa.com', ordem: 8 },
    { nome: 'Colar de coração prateado', descricao: 'Colar delicado com pingente de coração, banho prata.', categoria: 'Acessórios', precoEstimado: 15000, moeda: 'KRW', urlProduto: 'https://www.coupang.com', ordem: 9 },
    { nome: 'Bolsa mini de couro vegano', descricao: 'Mini bolsa estilo coreano, alça de corrente, cores variadas.', categoria: 'Acessórios', precoEstimado: 48000, moeda: 'KRW', urlProduto: 'https://www.coupang.com', ordem: 10 },
    { nome: 'Lightstick oficial (edição usada, ótimo estado)', descricao: 'Lightstick oficial de grupo K-pop, usado por pouco tempo, sem riscos, com caixa.', categoria: 'Itens usados', precoEstimado: 65000, moeda: 'KRW', urlProduto: 'https://www.bunjang.co.kr', ordem: 11 },
    { nome: 'Photocard raro de grupo K-pop', descricao: 'Photocard oficial raro, edição limitada, em ótimo estado.', categoria: 'K-pop', precoEstimado: 25000, moeda: 'KRW', urlProduto: 'https://www.bunjang.co.kr', ordem: 12 },
    { nome: 'Pelúcia de mascote coreana', descricao: 'Pelúcia fofa estilo coreano, 30cm, ideal para decoração.', categoria: 'Outros', precoEstimado: 30000, moeda: 'KRW', urlProduto: 'https://www.coupang.com', ordem: 13 },
  ]

  let produtosCriados = 0
  for (const p of produtosShop) {
    const existe = await prisma.produtoShop.findFirst({ where: { nome: p.nome } })
    if (existe) continue
    await prisma.produtoShop.create({ data: p })
    produtosCriados++
  }
  if (produtosCriados > 0) console.log(`✅ ${produtosCriados} produtos do Personal Shopper criados com categorias`)
  else console.log('ℹ️  Produtos do Personal Shopper já existem (seed idempotente)')

  const categoriasPadrao = ['Álbuns', 'Maquiagem', 'Skincare', 'Roupas', 'Acessórios', 'Itens usados', 'K-pop', 'Outros']
  for (let i = 0; i < categoriasPadrao.length; i++) {
    const nome = categoriasPadrao[i]
    await prisma.shopCategoria.upsert({ where: { nome }, update: {}, create: { nome, ordem: i, ativo: true } })
  }
  console.log('✅ Categorias do Shop verificadas (editáveis em /admin/shop)')

  // 5 clientes com dados realistas
  const clientes = [
    {
      email: 'ana.souza@gmail.com',
      senha: 'Cliente@123',
      nome: 'Ana Luiza Souza',
      telefone: '+55 11 99234-5678',
      pais: 'Brazil',
      cidade: 'São Paulo',
      cep: '01310-100',
      endereco: 'Av. Paulista, 1000, Apto 42',
      suite: 1,
    },
    {
      email: 'beatriz.lima@gmail.com',
      senha: 'Cliente@123',
      nome: 'Beatriz Lima Ferreira',
      telefone: '+55 21 98765-4321',
      pais: 'Brazil',
      cidade: 'Rio de Janeiro',
      cep: '22460-040',
      endereco: 'Rua Garcia d\'Ávila, 56',
      suite: 2,
    },
    {
      email: 'carolina.m@hotmail.com',
      senha: 'Cliente@123',
      nome: 'Carolina Mendes',
      telefone: '+55 31 97654-3210',
      pais: 'Brazil',
      cidade: 'Belo Horizonte',
      cep: '30140-110',
      endereco: 'Av. Afonso Pena, 500',
      suite: 3,
    },
    {
      email: 'daniela.costa@gmail.com',
      senha: 'Cliente@123',
      nome: 'Daniela Costa Rodrigues',
      telefone: '+351 91 234-5678',
      pais: 'Portugal',
      cidade: 'Lisboa',
      cep: '1200-109',
      endereco: 'Rua Augusta, 150',
      suite: 4,
    },
    {
      email: 'fernanda.park@gmail.com',
      senha: 'Cliente@123',
      nome: 'Fernanda Park',
      telefone: '+55 48 99876-5432',
      pais: 'Brazil',
      cidade: 'Florianópolis',
      cep: '88010-000',
      endereco: 'Rua Felipe Schmidt, 200',
      suite: 5,
    },
  ]

  const clienteIds: string[] = []

  // Clientes demo — SÓ cria se o email não existir E a suite estiver livre
  // (em produção as suites 1–5 costumam estar ocupadas por clientes reais: pula com aviso)
  for (const c of clientes) {
    const emailJaExiste = await prisma.usuario.findUnique({ where: { email: c.email } })
    if (emailJaExiste) {
      console.log(`⏭️  Cliente demo ${c.email} já existe — pulando`)
      continue
    }
    const suiteOcupada = await prisma.cliente.findUnique({ where: { numeroDeSuite: c.suite } })
    if (suiteOcupada) {
      console.log(`⏭️  Suite ${c.suite} já ocupada por cliente real — pulando demo ${c.email}`)
      continue
    }
    const senhaHash = await hash(c.senha, 12)
    const usuario = await prisma.usuario.create({
      data: {
        email: c.email,
        senha: senhaHash,
        role: 'CLIENTE',
        cliente: {
          create: {
            numeroDeSuite: c.suite,
            nomeCompleto: c.nome,
            telefone: c.telefone,
            pais: c.pais,
            cidade: c.cidade,
            cep: c.cep,
            endereco: c.endereco,
            status: 'ATIVA',
          },
        },
      },
      include: { cliente: true },
    })
    if (usuario.cliente) {
      clienteIds.push(usuario.cliente.id)
      console.log(`✅ Cliente Suite #${String(c.suite).padStart(3, '0')}: ${c.nome}`)
    }
  }

  // Buscar IDs dos clientes reais
  const clientesDb = await prisma.cliente.findMany({
    where: { numeroDeSuite: { in: [1, 2, 3, 4, 5] } },
    orderBy: { numeroDeSuite: 'asc' },
  })

  const idBySuite = Object.fromEntries(clientesDb.map((c) => [c.numeroDeSuite, c.id]))

  // Itens distribuídos com status e datas variados
  const agora = new Date()
  const diasAtras = (n: number) => new Date(agora.getTime() - n * 24 * 60 * 60 * 1000)

  const itens = [
    // Suite 1 — Ana Luiza
    {
      clienteId: idBySuite[1],
      descricao: 'COSRX Advanced Snail 96 Mucin Power Essence',
      lojaOrigem: 'Olive Young',
      trackingLoja: 'OY2024001234',
      peso: 0.35,
      valorDeclarado: 35000,
      moeda: 'KRW',
      status: 'EM_ARMAZEM' as const,
      dataEntrada: diasAtras(45),
    },
    {
      clienteId: idBySuite[1],
      descricao: 'Laneige Lip Sleeping Mask Berry 20g',
      lojaOrigem: 'Olive Young',
      trackingLoja: 'OY2024001235',
      peso: 0.1,
      valorDeclarado: 12000,
      moeda: 'KRW',
      status: 'RECEBIDO' as const,
      dataEntrada: diasAtras(5),
    },
    // Suite 2 — Beatriz
    {
      clienteId: idBySuite[2],
      descricao: 'Some By Mi AHA BHA PHA 30 Days Miracle Toner',
      lojaOrigem: 'Coupang',
      trackingLoja: 'CP2024009876',
      peso: 0.25,
      valorDeclarado: 18000,
      moeda: 'KRW',
      status: 'ENVIADO' as const,
      dataEntrada: diasAtras(70),
      dataEnvio: diasAtras(10),
    },
    {
      clienteId: idBySuite[2],
      descricao: 'Etude House Soon Jung 2x Barrier Intensive Cream',
      lojaOrigem: 'Olive Young',
      trackingLoja: 'OY2024002111',
      peso: 0.15,
      valorDeclarado: 22000,
      moeda: 'KRW',
      status: 'RECEBIDO' as const,
      dataEntrada: diasAtras(3),
    },
    // Suite 3 — Carolina
    {
      clienteId: idBySuite[3],
      descricao: 'Sulwhasoo Concentrated Ginseng Renewing Serum',
      lojaOrigem: 'Sulwhasoo Official',
      trackingLoja: 'SW2024005500',
      peso: 0.08,
      valorDeclarado: 180000,
      moeda: 'KRW',
      status: 'ENTREGUE' as const,
      dataEntrada: diasAtras(95),
      dataEnvio: diasAtras(60),
      dataEntrega: diasAtras(45),
    },
    {
      clienteId: idBySuite[3],
      descricao: 'Innisfree Green Tea Seed Serum 80ml',
      lojaOrigem: 'Olive Young',
      trackingLoja: 'OY2024003300',
      peso: 0.12,
      valorDeclarado: 28000,
      moeda: 'KRW',
      status: 'EM_ARMAZEM' as const,
      dataEntrada: diasAtras(80),
    },
    {
      clienteId: idBySuite[3],
      descricao: 'Round Lab Birch Juice Moisturizing Toner',
      lojaOrigem: 'Olive Young',
      trackingLoja: 'OY2024003301',
      peso: 0.22,
      valorDeclarado: 19000,
      moeda: 'KRW',
      status: 'RECEBIDO' as const,
      dataEntrada: diasAtras(2),
    },
    // Suite 4 — Daniela
    {
      clienteId: idBySuite[4],
      descricao: 'Dr. Jart+ Cicapair Tiger Grass Cream',
      lojaOrigem: 'Coupang',
      trackingLoja: 'CP2024007700',
      peso: 0.06,
      valorDeclarado: 45000,
      moeda: 'KRW',
      status: 'EM_ENVIO' as const,
      dataEntrada: diasAtras(35),
      dataEnvio: diasAtras(2),
    },
    {
      clienteId: idBySuite[4],
      descricao: 'Missha Time Revolution Night Repair Ampoule',
      lojaOrigem: 'Olive Young',
      trackingLoja: 'OY2024004400',
      peso: 0.05,
      valorDeclarado: 55000,
      moeda: 'KRW',
      status: 'RECEBIDO' as const,
      dataEntrada: diasAtras(10),
    },
    // Suite 5 — Fernanda
    {
      clienteId: idBySuite[5],
      descricao: 'Klairs Supple Preparation Unscented Toner',
      lojaOrigem: 'Olive Young',
      trackingLoja: 'OY2024005500',
      peso: 0.2,
      valorDeclarado: 24000,
      moeda: 'KRW',
      status: 'ENTREGUE' as const,
      dataEntrada: diasAtras(65),
      dataEnvio: diasAtras(35),
      dataEntrega: diasAtras(20),
    },
    {
      clienteId: idBySuite[5],
      descricao: 'Purito Centella Green Level Unscented Sun SPF50',
      lojaOrigem: 'Coupang',
      trackingLoja: 'CP2024008800',
      peso: 0.07,
      valorDeclarado: 16000,
      moeda: 'KRW',
      status: 'EM_ARMAZEM' as const,
      dataEntrada: diasAtras(55),
    },
    {
      clienteId: idBySuite[5],
      descricao: 'Beauty of Joseon Relief Sun: Rice + Probiotics SPF50',
      lojaOrigem: 'Olive Young',
      trackingLoja: 'OY2024005501',
      peso: 0.09,
      valorDeclarado: 15000,
      moeda: 'KRW',
      status: 'RECEBIDO' as const,
      dataEntrada: diasAtras(7),
    },
  ]

  // Itens demo: só para os clientes demo que este seed criou de fato
  // (clientesIds). Em produção as suites 1–5 são de clientes reais —
  // nunca adicionar itens de demonstração a clientes reais.
  const clientesDemoIds = new Set(clienteIds)
  for (const item of itens) {
    if (!item.clienteId || !clientesDemoIds.has(item.clienteId)) continue
    // Idempotente: não duplica itens de demonstração se o cliente já tiver a mesma descrição
    const jaExiste = await prisma.item.findFirst({
      where: { clienteId: item.clienteId, descricao: item.descricao },
    })
    if (jaExiste) continue
    await prisma.item.create({
      data: {
        clienteId: item.clienteId,
        descricao: item.descricao,
        lojaOrigem: item.lojaOrigem,
        trackingLoja: item.trackingLoja,
        status: item.status,
        dataEntrada: item.dataEntrada,
        dataEnvio: 'dataEnvio' in item ? item.dataEnvio : undefined,
        dataEntrega: 'dataEntrega' in item ? item.dataEntrega : undefined,
      },
    })
  }
  console.log(`✅ ${itens.length} itens criados com status e datas variados`)

  // Frete — Config + Países + Caixas + Tarifas exemplo (idempotente)
  const freteConfig = await prisma.freteConfig.findFirst()
  if (!freteConfig) {
    await prisma.freteConfig.create({
      data: {
        titulo: 'Calculadora de Frete',
        subtitulo: 'Simule o frete por país, peso e caixa. O valor exibido é apenas uma estimativa e pode diferir do final.',
        introducaoHtml: '<p>Bem-vinda à <strong>calculadora de frete</strong> da KMundo. Selecione o país, informe o peso e escolha a caixa para ver a estimativa instantânea.</p>',
        comoFuncionaHtml: '<p>1. Escolha o <strong>país de destino</strong>.<br/>2. Informe o <strong>peso (kg)</strong> da caixa.<br/>3. Selecione o <strong>tamanho da caixa</strong> (opcional) e clique em Calcular.</p>',
        avisoEstimativaHtml: '<p><strong>⚠️ Atenção:</strong> o valor exibido é apenas uma <em>estimativa</em>. O valor final é confirmado pela equipe no fechamento do envio e pode variar por pesagem oficial, dimensões finais e taxas do transportador.</p>',
        comoPesoHtml: '<p>O peso é o principal fator. Cada faixa (ex: 0,1–1 kg, 1,01–3 kg) tem um valor. Quanto maior o peso, maior a tarifa.</p>',
        comoPaisHtml: '<p>Cada país tem tarifas próprias. Selecione corretamente o destino para ver o valor correspondente.</p>',
        comoCaixasHtml: '<p>Trabalhamos com caixas P, M e G com medidas padrão. Você pode simular sem escolher a caixa (tarifa genérica) ou escolher para refinar o cálculo.</p>',
        taxasServicoHtml: '<p>Algumas tarifas incluem <strong>taxa de serviço</strong> (manuseio/embalagem). Ela é exibida separadamente e já somada no total.</p>',
        diferencasValorHtml: '<p>Diferenças podem ocorrer por: pesagem oficial dos Correios/transportadora, cubagem, variação cambial e ajustes de embalagem.</p>',
        regrasAdicionaisHtml: '<p>Em caso de dúvida, fale com a equipe via WhatsApp antes de fechar o envio.</p>',
      },
    })
    console.log('✅ FreteConfig criada')
  }

  const paisesSeed = [
    { nome: 'Brasil', codigo: 'BR', moeda: 'BRL', ordem: 1 },
    { nome: 'Portugal', codigo: 'PT', moeda: 'EUR', ordem: 2 },
    { nome: 'Estados Unidos', codigo: 'US', moeda: 'USD', ordem: 3 },
    { nome: 'Chile', codigo: 'CL', moeda: 'USD', ordem: 4 },
  ]
  for (const p of paisesSeed) {
    await prisma.fretePais.upsert({ where: { codigo: p.codigo }, update: {}, create: p })
  }
  console.log('✅ Países de frete verificados')

  const caixasSeed = [
    { nome: 'Caixa P', descricao: 'Pequena — ideal para 1–3 itens leves', comprimento: 25, largura: 20, altura: 12, pesoMax: 2, ordem: 1 },
    { nome: 'Caixa M', descricao: 'Média — padrão mais usado', comprimento: 32, largura: 26, altura: 18, pesoMax: 5, ordem: 2 },
    { nome: 'Caixa G', descricao: 'Grande — para volumes maiores', comprimento: 42, largura: 32, altura: 24, pesoMax: 10, ordem: 3 },
  ]
  for (const c of caixasSeed) {
    const existe = await prisma.freteCaixaTipo.findFirst({ where: { nome: c.nome } })
    if (!existe) await prisma.freteCaixaTipo.create({ data: c })
  }
  console.log('✅ Caixas padrão verificadas')

  const br = await prisma.fretePais.findUnique({ where: { codigo: 'BR' } })
  if (br) {
    const tarifasExemplo = [
      { pesoMin: 0.01, pesoMax: 1, valor: 85, moeda: 'BRL', taxaServico: 5 },
      { pesoMin: 1.01, pesoMax: 3, valor: 120, moeda: 'BRL', taxaServico: 5 },
      { pesoMin: 3.01, pesoMax: 5, valor: 165, moeda: 'BRL', taxaServico: 5 },
      { pesoMin: 5.01, pesoMax: 10, valor: 230, moeda: 'BRL', taxaServico: 10 },
    ]
    for (const t of tarifasExemplo) {
      const existe = await prisma.freteTarifa.findFirst({ where: { paisId: br.id, caixaTipoId: null, pesoMin: t.pesoMin, pesoMax: t.pesoMax } })
      if (!existe) await prisma.freteTarifa.create({ data: { paisId: br.id, caixaTipoId: null, ...t } })
    }
    console.log('✅ Tarifas exemplo BR criadas')
  }

  const pedidoConfig = await prisma.pedidoConfig.findFirst()
  if (!pedidoConfig) {
    await prisma.pedidoConfig.create({
      data: {
        titulo: 'Meus Pedidos',
        subtitulo: 'Acompanhe seus pedidos de compra da Coreia.',
        introducaoHtml: '<p><strong>Área de Pedidos</strong></p><p>Nesta área, você pode acompanhar todas as suas solicitações de compra realizadas através do serviço de Personal Shopper.</p><p>Caso você não encontre o item que deseja em nossa vitrine, também poderá solicitar a compra diretamente por esta área. Para isso, clique em “Novo Pedido”, preencha todas as informações necessárias e envie sua solicitação.</p><p>Após o envio, aguarde a análise e confirmação da nossa equipe. Assim que houver uma atualização sobre o seu pedido, você poderá acompanhá-la diretamente nesta área.</p><p>Abaixo, você encontrará todas as informações e orientações sobre o funcionamento desse serviço. Pedimos que leia atentamente antes de realizar uma solicitação.</p>',
        comoFuncionaHtml: '<p>Você adiciona produtos ao carrinho na Personal Shopper e envia <strong>uma única solicitação</strong>. Nossa equipe revisa, verifica disponibilidade e informa o valor total.</p>',
        passoAPassoHtml: '<ol><li>Adicione itens ao carrinho</li><li>Revise e envie o pedido</li><li>Aguarde nossa revisão e valor</li><li>Realize o pagamento</li><li>Envie o comprovante aqui</li><li>Aguardamos confirmação e compramos</li></ol>',
        podeNaoPodeHtml: '<p><strong>Pode:</strong> enviar vários itens de uma vez, adicionar variação e observações.<br/><strong>Não pode:</strong> editar pedido após envio — fale com a equipe.</p>',
        etapasHtml: '<p><strong>Aguardando revisão</strong> → <strong>Aguardando pagamento</strong> → <strong>Aguardando confirmação</strong> → <strong>Pago/Confirmado</strong> → <strong>Comprado</strong></p>',
        regrasHtml: '<p>Valores são confirmados após verificação de estoque. Pagamentos via Pix ou cartão (WhatsApp). Envie o comprovante aqui para agilizar.</p>',
        posPedidoHtml: '<p>Após o pagamento confirmado, compramos e vinculamos os itens ao seu armazém. Você acompanha em Meus Itens.</p>',
        regrasAdicionaisHtml: '<p>Em caso de item indisponível, estornamos ou sugerimos similar. Dúvidas? Fale no WhatsApp.</p>',
      },
    })
    console.log('✅ PedidoConfig criada')
  }

  const envioConfig = await prisma.envioConfig.findFirst()
  if (!envioConfig) {
    await prisma.envioConfig.create({
      data: {
        titulo: 'Envios',
        subtitulo: 'Solicite e acompanhe seus envios da Coreia até sua casa.',
        introducaoHtml: '<p>Solicite seu envio informando os itens, valor declarado e endereço completo. Nossa equipe cuida do resto.</p>',
        termosUsoHtml: '<p>Ao solicitar o envio você concorda com nossos Termos de Uso e Condições do Serviço. Leia com atenção antes de enviar.</p>',
        avisoValorDeclaradoHtml: '<p><strong>Importante:</strong> o preenchimento do valor declarado é obrigatório para envios individuais. Em envios em grupo, não é obrigatório.<br/>O cliente deve informar corretamente o nome do item conforme deseja que ele seja declarado na etiqueta, juntamente com o valor declarado em dólar. A K-Mundo Warehouse não se responsabiliza pelos valores ou informações escolhidos pelo cliente.</p>',
        avisoEnderecoHtml: '<p><strong>Endereço completo — obrigatório:</strong> informe todos os dados necessários para a entrega, incluindo endereço completo, número, cidade, estado, país, e-mail, telefone e outras informações necessárias. Confira cuidadosamente antes de enviar.</p>',
        avisoEnderecoCoreanoHtml: '<p><strong>Importante:</strong> se você estiver utilizando um endereço coreano, é obrigatório informar o endereço completo em coreano e o número de telefone da pessoa responsável pelo recebimento.</p>',
        painelInfoHtml: '<p><strong>Como funciona:</strong> 1. Solicite o envio → 2. Aguardamos confirmação → 3. Informamos valor do frete → 4. Você paga e envia comprovante → 5. Confirmamos pagamento → 6. Enviamos a caixa → 7. Você confirma recebimento.</p>',
        statusAguardandoConfirmacaoHtml: '<p><strong>Aguardando confirmação:</strong> recebemos sua solicitação. Vamos conferir os itens, fechar a caixa e informar o valor do frete em breve.</p>',
        statusAguardandoPagamentoHtml: '<p><strong>Aguardando pagamento:</strong> o valor do frete foi informado. Realize o pagamento via Pix/cartão e envie o comprovante aqui.</p>',
        statusAguardandoConfirmacaoPagamentoHtml: '<p><strong>Aguardando confirmação do pagamento:</strong> comprovante recebido! Vamos verificar o pagamento na conta e alterar para “Pagamento feito” assim que cair.</p>',
        statusPagamentoFeitoHtml: '<p><strong>Pagamento feito:</strong> pagamento confirmado! Vamos embalar e enviar sua caixa em breve. Fique atenta ao rastreamento.</p>',
        statusEnviadoHtml: '<p><strong>Enviado:</strong> sua caixa foi enviada! Use o código de rastreamento para acompanhar. Ao receber, clique em “Caixa recebida” e anexe fotos se desejar.</p>',
        statusCaixaRecebidaHtml: '<p><strong>Caixa recebida:</strong> obrigado por confirmar! Se precisar, entre em contato.</p>',
        prazosHtml: '<p>Fechamento da caixa em até 2 dias úteis após confirmação. Envio em até 3 dias úteis após pagamento feito.</p>',
        pagamentoHtml: '<p>Pagamento via Pix (QR Code/chave) ou cartão via WhatsApp. Envie o comprovante aqui — não precisa mandar por WhatsApp.</p>',
        comprovanteHtml: '<p>Envie comprovante em imagem ou PDF (até 10MB). Status muda automaticamente para “Aguardando confirmação do pagamento”.</p>',
        envioHtml: '<p>Após “Pagamento feito”, sua caixa será fechada e enviada com rastreamento. Acompanhe em Detalhes do envio.</p>',
        recebimentoHtml: '<p>Ao receber, clique em “Caixa recebida” e anexe fotos como registro. Isso atualiza automaticamente para nós.</p>',
        regrasAdicionaisHtml: '<p>Confira endereço e valor declarado antes de enviar. Dúvidas? Fale no WhatsApp da recepção.</p>',
      },
    })
    console.log('✅ EnvioConfig criada')
  }

  console.log('\n🎉 Seed concluído!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Admin:    ${adminEmail} / ${adminPassword}`)
  console.log('Clientes: ana.souza@gmail.com / Cliente@123 (Suite #001)')
  console.log('          beatriz.lima@gmail.com / Cliente@123 (Suite #002)')
  console.log('          carolina.m@hotmail.com / Cliente@123 (Suite #003)')
  console.log('          daniela.costa@gmail.com / Cliente@123 (Suite #004)')
  console.log('          fernanda.park@gmail.com / Cliente@123 (Suite #005)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
