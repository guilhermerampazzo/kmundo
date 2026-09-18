-- CreateTable caixas_envio
CREATE TABLE "caixas_envio" (
    "id" TEXT NOT NULL,
    "envioId" TEXT NOT NULL,
    "caixaId" TEXT NOT NULL,
    CONSTRAINT "caixas_envio_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "caixas_envio_envioId_idx" ON "caixas_envio"("envioId");
CREATE INDEX "caixas_envio_caixaId_idx" ON "caixas_envio"("caixaId");
ALTER TABLE "caixas_envio" ADD CONSTRAINT "caixas_envio_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "envios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "caixas_envio" ADD CONSTRAINT "caixas_envio_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "caixas_recebidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Novos status de PedidoCompra (só ADD VALUE; uso dos valores fica para a próxima migration)
ALTER TYPE "StatusPedidoCompra" ADD VALUE IF NOT EXISTS 'SOLICITADO';
ALTER TYPE "StatusPedidoCompra" ADD VALUE IF NOT EXISTS 'EM_ANALISE';
ALTER TYPE "StatusPedidoCompra" ADD VALUE IF NOT EXISTS 'COTACAO_DISPONIVEL';
ALTER TYPE "StatusPedidoCompra" ADD VALUE IF NOT EXISTS 'AGUARDANDO_CONFIRMACAO_CLIENTE';
ALTER TYPE "StatusPedidoCompra" ADD VALUE IF NOT EXISTS 'PAGAMENTO_FEITO';
