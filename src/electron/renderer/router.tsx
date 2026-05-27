import { createHashRouter } from 'react-router';
import { AgentRunDetailRoute } from './routes/AgentRunDetailRoute';
import { AgentRunsRoute } from './routes/AgentRunsRoute';
import { AppShell } from './routes/AppShell';
import { HomeRoute } from './routes/HomeRoute';
import { NewAgentRunRoute } from './routes/NewAgentRunRoute';
import { NotesRoute } from './routes/NotesRoute';
import { ProjectsRoute } from './routes/ProjectsRoute';
import { RouteError } from './routes/RouteError';
import { SettingsRoute } from './routes/SettingsRoute';

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
      { path: 'projects', element: <ProjectsRoute /> },
      { path: 'notes', element: <NotesRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
    ],
  },
]);
