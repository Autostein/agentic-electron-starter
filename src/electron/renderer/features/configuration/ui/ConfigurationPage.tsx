import { Box, FolderGit2, KeyRound, type LucideIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { ProviderAuthPage } from '../../agent-runtime/ui/ProviderAuthPage';
import { RuntimesPage } from '../../agent-runtime/ui/RuntimesPage';
import { WorkspacesPage } from '../../workspaces/ui/WorkspacesPage';

type ConfigurationTab = 'workspaces' | 'runtimes' | 'providers';

const tabs: Array<{ id: ConfigurationTab; label: string; icon: LucideIcon }> = [
  { id: 'workspaces', label: 'Workspaces', icon: FolderGit2 },
  { id: 'runtimes', label: 'Runtimes', icon: Box },
  { id: 'providers', label: 'Providers', icon: KeyRound },
];

export function ConfigurationPage() {
  const [searchParams] = useSearchParams();
  const activeTab = toConfigurationTab(searchParams.get('tab'));

  return (
    <section className="max-w-6xl">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
          Run setup
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Configuration</h2>
      </div>

      <div className="mt-6 border-b border-zinc-800">
        <nav aria-label="Configuration sections" className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                to={`/configuration?tab=${tab.id}`}
                className={[
                  'inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition',
                  selected
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100',
                ].join(' ')}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'workspaces' && <WorkspacesPage />}
        {activeTab === 'runtimes' && <RuntimesPage />}
        {activeTab === 'providers' && <ProviderAuthPage />}
      </div>
    </section>
  );
}

function toConfigurationTab(tab: string | null): ConfigurationTab {
  if (tab === 'runtimes' || tab === 'providers') {
    return tab;
  }

  return 'workspaces';
}
