import { useState } from 'react';
import { Code2, Save, Edit } from 'lucide-react';
import type { DashboardState } from '../../generated/dashboard';

interface ConfigurationPanelProps {
  dashboard: DashboardState;
  onConfigUpdate: (config: Record<string, string>) => void;
}

export function ConfigurationPanel({ dashboard, onConfigUpdate }: ConfigurationPanelProps) {
  const [editingConfig, setEditingConfig] = useState(false);
  const [configText, setConfigText] = useState(JSON.stringify(dashboard.config, null, 2));
  const [configError, setConfigError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const newConfig = JSON.parse(configText);
      onConfigUpdate(newConfig);
      setEditingConfig(false);
      setConfigError(null);
    } catch (err) {
      setConfigError('Invalid JSON format');
    }
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Configuration</h2>
        </div>
        <button
          onClick={() => {
            if (editingConfig) {
              handleSave();
            } else {
              setConfigText(JSON.stringify(dashboard.config, null, 2));
              setEditingConfig(true);
              setConfigError(null);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${editingConfig ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'}`}
        >
          {editingConfig ? (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Edit
            </>
          )}
        </button>
      </div>

      {configError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-600 dark:text-red-400">{configError}</div>
      )}

      {editingConfig ? (
        <textarea
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
          className="w-full h-32 p-3 font-mono text-sm bg-muted rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          spellCheck={false}
        />
      ) : (
        <pre className="p-3 bg-muted rounded-md overflow-x-auto">
          <code className="text-sm font-mono">{JSON.stringify(dashboard.config, null, 2)}</code>
        </pre>
      )}
    </div>
  );
}
