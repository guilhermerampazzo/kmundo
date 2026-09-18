-- AlterTable: caixas_recebidas add fotoEtiquetaUrls, pedidos_compra_itens add fotoUrls
ALTER TABLE "caixas_recebidas" ADD COLUMN "fotoEtiquetaUrls" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "pedidos_compra_itens" ADD COLUMN "fotoUrls" TEXT[] NOT NULL DEFAULT '{}';
