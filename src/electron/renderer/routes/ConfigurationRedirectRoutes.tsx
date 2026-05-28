import { Navigate } from 'react-router';

export function WorkspaceConfigurationRedirectRoute() {
  return <Navigate to="/configuration?tab=workspaces" replace />;
}

export function RuntimeConfigurationRedirectRoute() {
  return <Navigate to="/configuration?tab=runtimes" replace />;
}
