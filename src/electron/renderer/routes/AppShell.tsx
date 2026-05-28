import { Bot, NotebookText, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

const navItems = [
  { to: '/', label: 'Runs', icon: Bot },
  { to: '/configuration', label: 'Configuration', icon: Settings },
  { to: '/notes', label: 'Notes sample', icon: NotebookText },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="grid min-h-screen grid-cols-[240px_1fr]">
        <aside className="border-r border-zinc-800 bg-zinc-900/80 px-4 py-5">
          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
              Orchestration
            </p>
            <h1 className="mt-2 text-xl font-semibold text-white">
              Agentic Electron
            </h1>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
                  ].join(' ')
                }
              >
                <item.icon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 px-8 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
