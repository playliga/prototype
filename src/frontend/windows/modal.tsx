/**
 * Reusable modal browser window.
 *
 * @module
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import Routes from '@liga/frontend/routes';
import { createMemoryRouter, RouterProvider, Outlet, useNavigate } from 'react-router-dom';
import { Constants } from '@liga/shared';
import '@liga/frontend/assets/styles.css';

/**
 * Configure routes.
 *
 * @constant
 */
const routes = createMemoryRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: '/brackets',
        element: <Routes.Modal.Brackets />,
      },
      {
        path: '/settings',
        element: <Routes.Modal.Settings />,
      },
      {
        path: '/kb/csgo',
        element: <Routes.Modal.CSGO />,
      },
      {
        path: '/issue',
        element: <Routes.Modal.Issue />,
      },
    ],
  },
]);

/**
 * The root component.
 *
 * @component
 */
function Root() {
  const navigate = useNavigate();

  // navigate to the modal route being requested
  const onModalCreate = (data: ModalRequest) => {
    navigate(data.target, { state: data.payload });
  };

  // attach listeners on mount
  React.useEffect(() => {
    api.ipc.on(Constants.IPCRoute.WINDOW_SEND, onModalCreate);
  }, []);

  return (
    <React.StrictMode>
      <Outlet />
    </React.StrictMode>
  );
}

/**
 * The index component
 *
 * @component
 */
function Index() {
  return <RouterProvider router={routes} />;
}

/**
 * React bootstrapping logic.
 *
 * @name anonymous
 * @function
 */
(() => {
  // grab the root container
  const container = document.getElementById('root');
  container.setAttribute('id', 'modal');

  if (!container) {
    throw new Error('Failed to find the root element.');
  }

  // render the react application
  ReactDOM.createRoot(container).render(<Index />);
})();
