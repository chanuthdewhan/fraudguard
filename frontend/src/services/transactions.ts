import { API_URL, USE_MOCKS } from './api';
import { mockTransactions } from '@/lib/mockData';
import type { Transaction, TransactionListResponse, RiskTier } from '@/types';

export async function fetchTransactions(riskTier?: RiskTier): Promise<Transaction[]> {
  if (USE_MOCKS) {
    return riskTier
      ? mockTransactions.filter((t) => t.prediction.riskTier === riskTier)
      : mockTransactions;
  }

  const query = riskTier ? `?riskTier=${riskTier}` : '';
  const res = await fetch(`${API_URL}/transactions${query}`);
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  const data: TransactionListResponse = await res.json();
  return data.transactions;
}

export async function fetchTransactionById(id: string): Promise<Transaction> {
  if (USE_MOCKS) {
    const found = mockTransactions.find((t) => t.id === id);
    if (!found) throw new Error(`Mock transaction ${id} not found`);
    return found;
  }

  const res = await fetch(`${API_URL}/transactions/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch transaction ${id}: ${res.status}`);
  return res.json();
}
