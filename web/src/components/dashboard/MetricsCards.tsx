import { Users, Thermometer, TrendingUp } from 'lucide-react';
import type { DashboardState } from '../../generated/dashboard';

interface MetricsCardsProps {
  dashboard: DashboardState;
  onSliderChange: (field: keyof DashboardState, value: number) => void;
}

export function MetricsCards({ dashboard, onSliderChange }: MetricsCardsProps) {
  const metrics = [
    { field: 'userCount' as keyof DashboardState, label: 'User Count', icon: Users, value: dashboard.userCount, max: 200, step: 1, unit: '' },
    {
      field: 'temperature' as keyof DashboardState,
      label: 'Temperature',
      icon: Thermometer,
      value: dashboard.temperature,
      max: 50,
      step: 0.5,
      unit: '°C',
    },
    {
      field: 'progressPercentage' as keyof DashboardState,
      label: 'Progress',
      icon: TrendingUp,
      value: dashboard.progressPercentage,
      max: 100,
      step: 1,
      unit: '%',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map(({ field, label, icon: Icon, value, max, step, unit }) => (
        <div key={field} className="bg-card rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">{label}</h3>
          </div>
          <div className="space-y-3">
            <div className="text-2xl font-bold">
              {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
              {unit}
            </div>
            <input
              type="range"
              min="0"
              max={max}
              step={step}
              value={value}
              onChange={(e) => onSliderChange(field, Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            />
            {field === 'progressPercentage' && (
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${value}%` }} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
