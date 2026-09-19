import { API_URL, USE_MOCKS } from './api';
import { mockStats } from '@/lib/mockData';
import type { StatsResponse } from '@/types';

export async function fetchStats(): Promise<StatsResponse> {
  if (USE_MOCKS) {
    return mockStats;
  }

  const res = await fetch(`${API_URL}/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}
