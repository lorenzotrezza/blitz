import { RouterProvider } from 'react-router-dom';

import { createAppRouter } from './router';

const appRouter = createAppRouter();

export function App() {
  return <RouterProvider router={appRouter} />;
}
