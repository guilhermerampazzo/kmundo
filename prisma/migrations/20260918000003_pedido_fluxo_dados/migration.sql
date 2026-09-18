-- Migração de dados do fluxo antigo de PedidoCompra para o novo (transação separada dos ADD VALUE)
UPDATE "pedidos_compra" SET "status" = 'SOLICITADO' WHERE "status" = 'AGUARDANDO_REVISAO';
UPDATE "pedidos_compra" SET "status" = 'PAGAMENTO_FEITO' WHERE "status" IN ('AGUARDANDO_CONFIRMACAO', 'PAGO');

-- Default novo
ALTER TABLE "pedidos_compra" ALTER COLUMN "status" SET DEFAULT 'SOLICITADO';
