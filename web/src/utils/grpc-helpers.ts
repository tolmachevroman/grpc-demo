// web/src/utils/grpc-helpers.ts
import { INITIAL_DASHBOARD } from '../constants/dashboard';
import type { DashboardState } from '../generated/dashboard';

export const normalizeState = (state: Partial<DashboardState>): DashboardState => {
  console.log('🔄 normalizeState called with:', state);
  const normalized = {
    ...INITIAL_DASHBOARD,
    ...state,
  };
  console.log('🔄 normalizeState result:', normalized);
  return normalized;
};

export const withTimestamp = (updates: Partial<DashboardState>): Partial<DashboardState> => {
  return {
    ...updates,
    lastUpdated: Date.now().toString(),
  };
};
