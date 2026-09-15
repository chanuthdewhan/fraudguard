import { prisma } from '../lib/prisma.js';
import { mlClient, type TransactionFeaturePayload } from '../services/mlClient.js';

const SAMPLE_TRANSACTIONS: TransactionFeaturePayload[] = [
  // 1. Classic Drain Fraud: Transfer draining entire account to zero
  {
    step: 1,
    type: 'TRANSFER',
    amount: 181.0,
    nameOrig: 'C1305486145',
    oldbalanceOrg: 181.0,
    newbalanceOrig: 0.0,
    nameDest: 'C553264065',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
  },
  // 2. Large fraudulent Cash Out with immediate zero balance
  {
    step: 1,
    type: 'CASH_OUT',
    amount: 181.0,
    nameOrig: 'C840083671',
    oldbalanceOrg: 181.0,
    newbalanceOrig: 0.0,
    nameDest: 'C38997010',
    oldbalanceDest: 21182.0,
    newbalanceDest: 0.0,
  },
  // 3. High Value Transfer Fraud ($350,000)
  {
    step: 12,
    type: 'TRANSFER',
    amount: 350000.0,
    nameOrig: 'C2014918231',
    oldbalanceOrg: 350000.0,
    newbalanceOrig: 0.0,
    nameDest: 'C9921827361',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
  },
  // 4. Large Cash Out draining origin account ($280,000)
  {
    step: 15,
    type: 'CASH_OUT',
    amount: 280000.0,
    nameOrig: 'C3918291023',
    oldbalanceOrg: 280000.0,
    newbalanceOrig: 0.0,
    nameDest: 'C8819283741',
    oldbalanceDest: 0.0,
    newbalanceDest: 280000.0,
  },
  // 5. Normal Grocery Payment
  {
    step: 2,
    type: 'PAYMENT',
    amount: 24.5,
    nameOrig: 'C1231006815',
    oldbalanceOrg: 170136.0,
    newbalanceOrig: 170111.5,
    nameDest: 'M1979787155',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
  },
  // 6. Normal Coffee / Retail Payment
  {
    step: 3,
    type: 'PAYMENT',
    amount: 4.8,
    nameOrig: 'C1666544295',
    oldbalanceOrg: 21249.0,
    newbalanceOrig: 21244.2,
    nameDest: 'M2044282225',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
  },
  // 7. Regular Utility Bill Payment
  {
    step: 4,
    type: 'PAYMENT',
    amount: 116.8,
    nameOrig: 'C2048537720',
    oldbalanceOrg: 41554.0,
    newbalanceOrig: 41437.2,
    nameDest: 'M1230701703',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
  },
  // 8. Normal Cash In (Account Deposit)
  {
    step: 5,
    type: 'CASH_IN',
    amount: 500.0,
    nameOrig: 'C7718291029',
    oldbalanceOrg: 1200.0,
    newbalanceOrig: 1700.0,
    nameDest: 'C8829102931',
    oldbalanceDest: 5000.0,
    newbalanceDest: 4500.0,
  },
  // 9. Debit Card Transaction
  {
    step: 6,
    type: 'DEBIT',
    amount: 85.0,
    nameOrig: 'C4418291028',
    oldbalanceOrg: 3400.0,
    newbalanceOrig: 3315.0,
    nameDest: 'M9918273645',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
  },
  // 10. Medium Risk Ambiguous Transfer
  {
    step: 8,
    type: 'TRANSFER',
    amount: 45000.0,
    nameOrig: 'C9918273641',
    oldbalanceOrg: 60000.0,
    newbalanceOrig: 15000.0,
    nameDest: 'C1122334455',
    oldbalanceDest: 5000.0,
    newbalanceDest: 50000.0,
  },
];

async function seed() {
  console.log('Seeding sample transactions into PostgreSQL...');

  const existing = await prisma.transaction.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} transactions. Clearing existing test data...`);
    await prisma.transaction.deleteMany();
  }

  for (const rawTx of SAMPLE_TRANSACTIONS) {
    try {
      console.log(`Scoring transaction ${rawTx.type} of $${rawTx.amount} (${rawTx.nameOrig} -> ${rawTx.nameDest})...`);
      const explanationResult = await mlClient.explain(rawTx, 5);
      const { prediction } = explanationResult;

      await prisma.transaction.create({
        data: {
          step: rawTx.step,
          type: rawTx.type,
          amount: rawTx.amount,
          nameOrig: rawTx.nameOrig,
          oldbalanceOrg: rawTx.oldbalanceOrg,
          newbalanceOrig: rawTx.newbalanceOrig,
          nameDest: rawTx.nameDest,
          oldbalanceDest: rawTx.oldbalanceDest,
          newbalanceDest: rawTx.newbalanceDest,
          riskScore: prediction.risk_score,
          riskTier: prediction.risk_tier,
          isFraud: prediction.is_fraud,
          fraudProbability: prediction.fraud_probability,
          status: prediction.risk_tier === 'HIGH' ? 'PENDING' : 'APPROVED',
          explanation: explanationResult as unknown as object,
        },
      });
    } catch (err) {
      console.error(`Error seeding transaction for ${rawTx.nameOrig}:`, err);
    }
  }

  const finalCount = await prisma.transaction.count();
  console.log(`Seeding complete! Total transactions in DB: ${finalCount}`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

