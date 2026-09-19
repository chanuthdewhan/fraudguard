import { useQuery } from '@tanstack/react-query';
import { fetchTransactions, fetchTransactionById } from '@/services/transactions';
import type { RiskTier } from '@/types';

export function useTransactions(riskTier?: RiskTier) {
  return useQuery({
    // riskTier in the key means switching filters doesn't reuse stale cached results from a different filter.
    queryKey: ['transactions', riskTier ?? 'all'],
    queryFn: () => fetchTransactions(riskTier),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: () => fetchTransactionById(id),
    enabled: !!id,
  });
}
