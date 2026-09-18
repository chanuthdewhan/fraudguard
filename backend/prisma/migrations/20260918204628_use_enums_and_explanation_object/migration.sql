/*
  Warnings:

  - Changed the type of `riskTier` on the `Prediction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('low', 'medium', 'high');

-- AlterTable
ALTER TABLE "Prediction" DROP COLUMN "riskTier",
ADD COLUMN     "riskTier" "RiskTier" NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- CreateIndex
CREATE INDEX "Prediction_riskTier_idx" ON "Prediction"("riskTier");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt" DESC);
