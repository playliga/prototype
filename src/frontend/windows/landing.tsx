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
import {
  appInfoUpdate,
  continentsUpdate,
  localeUpdate,
  profilesUpdate,
  profileUpdate,
} from '@liga/frontend/redux/actions';
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
      // standalone routes
      {
        element: <Routes.Landing.Home />,
        index: true,
      },
      {
        path: '/connect/:id',
        element: <Routes.Landing.Connect />,
      },
      {
        path: '/exhibition',
        element: <Routes.Landing.Exhibition />,
      },

      // composite routes
      {
        path: '/load',
        element: <Routes.Landing.Load.Load />,
        children: [
          {
            path: '/load/delete/:id',
            element: <Routes.Landing.Load.Delete />,
          },
        ],
      },
      {
        path: '/create',
        element: <Routes.Landing.Create.Create />,
        children: [
          {
            element: <Routes.Landing.Create.User />,
            index: true,
          },
          {
            path: '/create/2',
            children: [
              {
                element: <Routes.Landing.Create.Team />,
                index: true,
              },
              {
                path: '/create/2/gallery',
                element: <Routes.Landing.Create.Gallery />,
              },
            ],
          },
          {
            path: '/create/3',
            element: <Routes.Landing.Create.Save />,
          },
        ],
      },
    ],
  },
]);

/**
 * The root component.
 *
 * @note Opting out of React Strict Mode to avoid re-render save issue.
 * @function
 */
function Root() {
  const { dispatch } = React.useContext(AppStateContext);

  React.useEffect(() => {
    api.profiles.current().then((profile) => dispatch(profileUpdate(profile)));
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
    api.app.locale().then((locale) => dispatch(localeUpdate(locale)));
  }, []);

  return (
    <React.Fragment>
      <VideoBackground>
        <source src={LandingVideo} type="video/mp4" />
      </VideoBackground>
      <div className="relative z-10 h-screen">
        <Outlet />
      </div>
    </React.Fragment>
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
  container.dataset.theme = Constants.ThemeSetting.DARK;

  // render the react application
  ReactDOM.createRoot(container).render(<Index />);
})();
