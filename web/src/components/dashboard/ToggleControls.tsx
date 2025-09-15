import { Power, Wrench, Bell } from 'lucide-react';
import type { DashboardState } from '../../generated/dashboard';

interface ToggleControlsProps {
  dashboard: DashboardState;
  onToggle: (field: keyof DashboardState) => void;
}

export function ToggleControls({ dashboard, onToggle }: ToggleControlsProps) {
  const controls = [
    { field: 'isEnabled' as keyof DashboardState, label: 'System Enabled', icon: Power, value: dashboard.isEnabled },
    { field: 'maintenanceMode' as keyof DashboardState, label: 'Maintenance Mode', icon: Wrench, value: dashboard.maintenanceMode },
    { field: 'notificationsOn' as keyof DashboardState, label: 'Notifications', icon: Bell, value: dashboard.notificationsOn },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {controls.map(({ field, label, icon: Icon, value }) => (
        <div key={field} className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{label}</span>
            </div>
            <button
              onClick={() => onToggle(field)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${value ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${value ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
