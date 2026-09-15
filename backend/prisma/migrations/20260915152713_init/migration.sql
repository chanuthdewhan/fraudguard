-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "nameOrig" TEXT NOT NULL,
    "oldbalanceOrg" DOUBLE PRECISION NOT NULL,
    "newbalanceOrig" DOUBLE PRECISION NOT NULL,
    "nameDest" TEXT NOT NULL,
    "oldbalanceDest" DOUBLE PRECISION NOT NULL,
    "newbalanceDest" DOUBLE PRECISION NOT NULL,
    "isFraud" BOOLEAN NOT NULL DEFAULT false,
    "isFlaggedFraud" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskTier" "RiskTier" NOT NULL DEFAULT 'LOW',
    "fraudProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "explanation" JSONB,
    "analystNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_riskTier_idx" ON "Transaction"("riskTier");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_riskScore_idx" ON "Transaction"("riskScore");
