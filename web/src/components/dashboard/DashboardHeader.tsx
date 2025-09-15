import { WifiOff, Wifi } from 'lucide-react';
import { DashboardState } from '../../generated/dashboard';

interface DashboardHeaderProps {
  dashboard: DashboardState;
  connected: boolean;
  error: string | null;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
  SunIcon?: React.FC;
  MoonIcon?: React.FC;
}

export function DashboardHeader({ dashboard, connected, error, theme, toggleTheme, SunIcon, MoonIcon }: DashboardHeaderProps) {
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
          {toggleTheme && SunIcon && MoonIcon && theme && (
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded transition-colors border border-transparent hover:border-primary flex-shrink-0"
              aria-label="Toggle dark/light mode"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
