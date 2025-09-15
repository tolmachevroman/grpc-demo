import { WifiOff, Wifi } from 'lucide-react';
import { DashboardState } from '../../generated/dashboard';

interface DashboardHeaderProps {
  dashboard: DashboardState;
  connected: boolean;
  error: string | null;
}

export function DashboardHeader({ dashboard, connected, error }: DashboardHeaderProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{dashboard.title}</h1>
          <p className="text-muted-foreground mt-2">{dashboard.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
            ${connected ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}
          >
            {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
        </div>
      </div>
    </div>
  );
}
