const secoes: Array<{ titulo: string; corpo: string }> = [
  {
    titulo: '1. Cadastro obrigatório da caixa',
    corpo: `Assim que realizar uma compra e sua caixa estiver a caminho do nosso endereço na Coreia, <strong>é obrigatório cadastrar a caixa em nosso site.</strong><br/><br/>No cadastro, você deverá informar: número de rastreamento correto da caixa, comprovante de compra e demais informações solicitadas no sistema.<br/><br/>O comprovante de compra deve apresentar <strong>todas as mercadorias que devem estar dentro daquela caixa.</strong><br/><br/>⚠️ Se uma caixa chegar ao nosso endereço sem ter sido previamente cadastrada no site, a K-Mundo Warehouse <strong>não poderá se responsabilizar pela identificação da caixa.</strong> Caso não seja possível identificar o proprietário, <strong>não realizaremos buscas adicionais.</strong>`,
  },
  {
    titulo: '2. Como cadastrar sua caixa',
    corpo: `1. Acesse nosso site.<br/>2. Entre na área <strong>Tracking</strong>.<br/>3. Clique para registrar uma nova caixa.<br/>4. Informe corretamente o número de rastreamento.<br/>5. Adicione a foto ou o arquivo do comprovante de compra.<br/>6. Confira todas as informações antes de finalizar.<br/><br/>Você pode cadastrar <strong>quantas caixas forem necessárias.</strong><br/><br/>O comprovante deve corresponder exatamente aos produtos dentro daquela caixa (ex: se comprou um álbum, o comprovante deve mostrar aquele álbum). <strong>Todos os produtos dentro da caixa devem estar no comprovante.</strong> Caso a loja envie mercadoria faltando, usaremos o comprovante para verificar. A K-Mundo <strong>não realiza conferência automática do conteúdo no recebimento</strong>.`,
  },
  {
    titulo: '3. Número de rastreamento',
    corpo: `Digite o número <strong>exatamente como fornecido pela loja ou transportadora.</strong> Não nos responsabilizamos por problemas de números cadastrados incorretamente. Confira tudo antes de finalizar.`,
  },
  {
    titulo: '4. Acompanhamento do status da caixa',
    corpo: `Após o cadastro, a caixa fica com status <strong>“A caminho”</strong>: ainda não chegou ou chegou mas não foi identificada/processada. Assim que identificada, registramos o recebimento (com foto da etiqueta, quando aplicável) e o status muda para <strong>recebida no armazém</strong>.`,
  },
  {
    titulo: '5. Conferência do conteúdo da caixa',
    corpo: `<strong>Importante:</strong> o recebimento não significa abertura e conferência de todos os produtos. Não nos responsabilizamos por produtos faltando, incorretos ou em quantidade diferente. Para verificar o conteúdo em detalhes, contrate nossos <strong>serviços de fotos ou vídeo da abertura da caixa.</strong>`,
  },
  {
    titulo: '6. Como solicitar fotos ou vídeo da abertura',
    corpo: `1. Acesse a área <strong>Serviços</strong>.<br/>2. Selecione a caixa pelo número de rastreamento.<br/>3. Escolha o serviço.<br/>4. Informe orientações no campo <strong>Detalhes</strong>.<br/>5. Finalize.<br/><br/>Acompanhe pelo site. Enquanto estiver <strong>“Solicitado”</strong>, ainda não foi concluído. Prazo de <strong>até 7 dias</strong>, podendo variar conforme a fila.`,
  },
  {
    titulo: '7. Acompanhamento dos serviços e pagamentos',
    corpo: `No site você acompanha serviços solicitados e concluídos, valores pendentes e pagos e o status de cada solicitação (cada serviço tem uma cor). Após a conclusão, fica registrado qual serviço foi realizado naquela caixa.<br/><br/>⚠️ <strong>Pagamento obrigatório antes do envio:</strong> quite todos os valores de serviços adicionais antes de solicitar o frete. Com pendência, o envio não pode ser solicitado.`,
  },
  {
    titulo: '8. Notificações',
    corpo: `Atualizações importantes de caixas e serviços vão para o <strong>e-mail cadastrado.</strong> Mantenha-o atualizado e verifique spam/lixo eletrônico.<br/><br/><strong>Ao utilizar nosso serviço, o cliente declara estar ciente e de acordo com todas as orientações, regras, prazos e responsabilidades deste guia.</strong>`,
  },
]

export function GuiaArmazenamento() {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5 mt-6">
      <h2 className="font-semibold mb-1" style={{ color: '#1A1A2E' }}>📦 Guia de Cadastro e Utilização do Serviço de Armazenamento</h2>
      <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
        Obrigada por contratar a <strong>K-Mundo Warehouse</strong>. Leia atentamente: o não cumprimento das orientações poderá impedir a identificação correta da sua caixa.
      </p>
      <div className="space-y-2">
        {secoes.map((s) => (
          <details key={s.titulo} className="rounded-lg border border-gray-100 overflow-hidden">
            <summary className="list-none flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium" style={{ color: '#1A1A2E', background: '#F9FAFB' }}>
              {s.titulo}
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: '#FFF1F5', color: '#FF6B9D' }}>+</span>
            </summary>
            <div className="px-4 py-3 text-sm leading-relaxed termos-content" style={{ color: '#374151' }} dangerouslySetInnerHTML={{ __html: s.corpo }} />
          </details>
        ))}
      </div>
    </div>
  )
}
