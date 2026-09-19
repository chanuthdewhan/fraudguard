import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '@/services/stats';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });
}
