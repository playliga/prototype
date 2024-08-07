/**
 * This window contains the start menu for the application
 * which allows the user to start new or load old saves.
 *
 * @module
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import Routes from '@liga/frontend/routes';
import LandingVideo from '@liga/frontend/assets/landing.webm';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Constants, Eagers } from '@liga/shared';
import { AppStateContext, AppStateProvider } from '@liga/frontend/redux';
import { appInfoUpdate, continentsUpdate, profilesUpdate } from '@liga/frontend/redux/actions';
import { VideoBackground } from '@liga/frontend/components';
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
        element: <Routes.Landing.Home />,
        index: true,
      },
      {
        path: '/load',
        element: <Routes.Landing.Load />,
        children: [
          {
            path: '/load/delete/:id',
            element: <Routes.Landing.Delete />,
          },
        ],
      },
      {
        path: '/connect/:id',
        element: <Routes.Landing.Connect />,
      },
      {
        path: '/create',
        element: <Routes.Landing.Create />,
        children: [
          {
            element: <Routes.Landing.User />,
            index: true,
          },
          {
            path: '/create/2',
            element: <Routes.Landing.Team />,
          },
          {
            path: '/create/3',
            element: <Routes.Landing.Save />,
          },
        ],
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
  const { dispatch } = React.useContext(AppStateContext);

  React.useEffect(() => {
    api.app.info().then((appInfo) => dispatch(appInfoUpdate(appInfo)));
    api.saves
      .all()
      .then((profiles) =>
        dispatch(
          profilesUpdate(profiles.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())),
        ),
      );
    api.continents
      .all(Eagers.continent)
      .then((continents) => dispatch(continentsUpdate(continents)));
  }, []);

  return (
    <React.StrictMode>
      <VideoBackground>
        <source src={LandingVideo} type="video/mp4" />
      </VideoBackground>
      <div className="relative z-10 h-screen">
        <Outlet />
      </div>
    </React.StrictMode>
  );
}

/**
 * The index component
 *
 * @component
 */
function Index() {
  return (
    <AppStateProvider>
      <RouterProvider router={routes} />
    </AppStateProvider>
  );
}

/**
 * React bootstrapping logic.
 *
 * @function
 * @name anonymous
 */
(() => {
  // grab the root container
  const container = document.getElementById('root');

  if (!container) {
    throw new Error('Failed to find the root element.');
  }

  // set the theme
  container.dataset.theme = Constants.ThemeSettings.DARK;

  // render the react application
  ReactDOM.createRoot(container).render(<Index />);
})();
