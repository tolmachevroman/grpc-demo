// web/src/utils/grpc-helpers.ts
import { INITIAL_DASHBOARD } from '../constants/dashboard';
import type { DashboardState } from '../generated/dashboard';

export const normalizeState = (state: Partial<DashboardState>): DashboardState => {
  return {
    ...INITIAL_DASHBOARD,
    ...state,
  };
};

export const withTimestamp = (updates: Partial<DashboardState>): Partial<DashboardState> => {
  return {
    ...updates,
    lastUpdated: Date.now().toString(),
  };
};
