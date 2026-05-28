import { isRouteErrorResponse, useRouteError } from 'react-router';
import { formatRendererError } from '../shared/errors';

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : formatRendererError(error);

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <h1 className="text-2xl font-semibold">Route error</h1>
      <p className="mt-3 text-zinc-300">{message}</p>
    </main>
  );
}
