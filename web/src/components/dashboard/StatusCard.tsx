import { Activity } from 'lucide-react';
import { Priority } from '../../generated/dashboard';
import { DashboardState } from '../../generated/dashboard';

const PRIORITY_CONFIG = {
  [Priority.UNSPECIFIED]: { label: 'Unspecified', color: 'bg-gray-500' },
  [Priority.LOW]: { label: 'Low', color: 'bg-green-500' },
  [Priority.MEDIUM]: { label: 'Medium', color: 'bg-yellow-500' },
  [Priority.HIGH]: { label: 'High', color: 'bg-orange-500' },
  [Priority.CRITICAL]: { label: 'Critical', color: 'bg-red-500' },
};

interface StatusCardProps {
  dashboard: DashboardState;
  onPriorityChange: (priority: Priority) => void;
}

export function StatusCard({ dashboard, onPriorityChange }: StatusCardProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">System Status</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-lg">{dashboard.statusMessage}</p>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium
            ${dashboard.isEnabled ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'}`}
          >
            {dashboard.isEnabled ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Priority Level</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
              <button
                key={value}
                onClick={() => onPriorityChange(Number(value) as Priority)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${dashboard.priority === Number(value) ? `${config.color} text-white` : 'bg-secondary hover:bg-secondary/80'}`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
