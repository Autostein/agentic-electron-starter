import { createHashRouter } from 'react-router';
import { AgentRunDetailRoute } from './routes/AgentRunDetailRoute';
import { AgentRunsRoute } from './routes/AgentRunsRoute';
import { AppShell } from './routes/AppShell';
import { ConfigurationRoute } from './routes/ConfigurationRoute';
import { HomeRoute } from './routes/HomeRoute';
import { NewAgentRunRoute } from './routes/NewAgentRunRoute';
import { NotesRoute } from './routes/NotesRoute';
import { WorkspaceDetailRoute } from './routes/WorkspaceDetailRoute';
import { WorkspacesRoute } from './routes/WorkspacesRoute';
import {
  RuntimeConfigurationRedirectRoute,
  WorkspaceConfigurationRedirectRoute,
} from './routes/ConfigurationRedirectRoutes';
import { RouteError } from './routes/RouteError';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: 'runs', element: <AgentRunsRoute /> },
      { path: 'runs/new', element: <NewAgentRunRoute /> },
      { path: 'runs/:runId', element: <AgentRunDetailRoute /> },
      { path: 'workspaces', element: <WorkspacesRoute /> },
      { path: 'workspaces/:workspaceId', element: <WorkspaceDetailRoute /> },
      { path: 'configuration', element: <ConfigurationRoute /> },
      { path: 'projects', element: <WorkspaceConfigurationRedirectRoute /> },
      { path: 'settings', element: <RuntimeConfigurationRedirectRoute /> },
      { path: 'notes', element: <NotesRoute /> },
    ],
  },
]);
