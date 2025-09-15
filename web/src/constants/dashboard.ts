// web/src/constants/dashboard.ts
import { Priority, DashboardState } from '../generated/dashboard';

export const PRIORITY_CONFIG = {
  [Priority.UNSPECIFIED]: { label: 'Unspecified', color: 'bg-gray-500' },
  [Priority.LOW]: { label: 'Low', color: 'bg-green-500' },
  [Priority.MEDIUM]: { label: 'Medium', color: 'bg-yellow-500' },
  [Priority.HIGH]: { label: 'High', color: 'bg-orange-500' },
  [Priority.CRITICAL]: { label: 'Critical', color: 'bg-red-500' },
} as const;

export const INITIAL_DASHBOARD: DashboardState = {
  title: 'System Dashboard',
  description: 'Main control panel for the system',
  statusMessage: 'All systems operational',
  isEnabled: true,
  maintenanceMode: false,
  notificationsOn: true,
  userCount: 42,
  temperature: 23.5,
  progressPercentage: 75,
  priority: Priority.MEDIUM,
  lastUpdated: Date.now().toString(),
  config: {
    theme: 'dark',
    language: 'en',
    refresh_rate: '5000',
  },
};
