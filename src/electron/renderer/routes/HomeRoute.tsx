import { useAppInfo } from '../features/app-info/hooks/use-app-info';

export function HomeRoute() {
  const appInfo = useAppInfo();

  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
        Desktop starter
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        Typed IPC, SQLite, and React Router Data Mode
      </h2>
      <p className="mt-4 text-zinc-300">
        This template ships one complete notes feature so future features can copy a working
        renderer-to-main flow.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
        <InfoItem label="App" value={appInfo.data?.name ?? 'Loading'} />
        <InfoItem label="Version" value={appInfo.data?.version ?? 'Loading'} />
        <InfoItem label="Platform" value={appInfo.data?.platform ?? 'Loading'} />
        <InfoItem label="Packaged" value={appInfo.data?.isPackaged ? 'Yes' : 'No'} />
      </dl>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
      <dd className="mt-2 font-medium text-zinc-100">{value}</dd>
    </div>
  );
}
