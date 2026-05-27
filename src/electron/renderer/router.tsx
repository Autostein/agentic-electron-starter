import { createHashRouter } from 'react-router';
import { AppShell } from './routes/AppShell';
import { HomeRoute } from './routes/HomeRoute';
import { NotesRoute } from './routes/NotesRoute';
import { RouteError } from './routes/RouteError';
import { SettingsRoute } from './routes/SettingsRoute';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: 'notes', element: <NotesRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
    ],
  },
]);
