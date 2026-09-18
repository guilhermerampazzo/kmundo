-- Novos tipos de serviço Foto e Vídeo separados (+ preços próprios)
ALTER TYPE "TipoServico" ADD VALUE IF NOT EXISTS 'FOTO';
ALTER TYPE "TipoServico" ADD VALUE IF NOT EXISTS 'VIDEO';

ALTER TABLE "configuracoes" ADD COLUMN "precoFoto" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "configuracoes" ADD COLUMN "precoVideo" DOUBLE PRECISION NOT NULL DEFAULT 0;
