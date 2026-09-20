import { useMutation } from '@tanstack/react-query';
import { postSimulate } from '@/services/simulate';

// A mutation, not a query - simulation is triggered by the user changing
// a value, not something to fetch and cache on mount.
export function useSimulate() {
  return useMutation({
    mutationFn: postSimulate,
  });
}
