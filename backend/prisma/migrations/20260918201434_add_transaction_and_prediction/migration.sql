-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "nameOrig" TEXT NOT NULL,
    "oldBalanceOrg" DOUBLE PRECISION NOT NULL,
    "newBalanceOrg" DOUBLE PRECISION NOT NULL,
    "nameDest" TEXT NOT NULL,
    "oldBalanceDest" DOUBLE PRECISION NOT NULL,
    "newBalanceDest" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskTier" TEXT NOT NULL,
    "explanation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_transactionId_key" ON "Prediction"("transactionId");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
