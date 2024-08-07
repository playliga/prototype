/**
 * The application's main window.
 *
 * @module
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import cx from 'classnames';
import Routes from '@liga/frontend/routes';
import { Toast, Toaster, toast } from 'react-hot-toast';
import { FaEnvelopeOpen } from 'react-icons/fa';
import { Constants, Eagers } from '@liga/shared';
import { AppStateContext, AppStateProvider } from '@liga/frontend/redux';
import {
  continentsUpdate,
  emailsUpdate,
  profileUpdate,
  appStatusUpdate,
} from '@liga/frontend/redux/actions';
import {
  createMemoryRouter,
  RouterProvider,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import '@liga/frontend/assets/styles.css';

/** @constant */
const SETTINGS_VALIDATE_FREQUENCY = 5000;

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
        element: <Routes.Main.Dashboard />,
        index: true,
      },
      {
        path: '/inbox',
        element: <Routes.Main.Inbox />,
      },
      {
        path: '/squad',
        element: <Routes.Main.Squad />,
      },
      {
        path: '/search',
        element: <Routes.Main.Search />,
      },
    ],
  },
]);

/**
 * Custom toast for incoming e-mail notifications.
 *
 * @param props       Root props.
 * @param props.email The email payload.
 * @function
 */
function ToastEmail(props: Toast & { email: Parameters<typeof emailsUpdate>[number][number] }) {
  return (
    <dialog>
      <section>
        <figure>
          <FaEnvelopeOpen />
        </figure>
        <article>
          <header>{props.email.from.name}</header>
          <footer>{props.email.subject}</footer>
        </article>
      </section>
      <section>
        <button onClick={() => toast.dismiss(props.id)}>Dismiss</button>
      </section>
    </dialog>
  );
}

/**
 * The root component.
 *
 * @component
 */
function Root() {
  const { dispatch, state } = React.useContext(AppStateContext);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // initial data fetch
    api.continents
      .all(Eagers.continent)
      .then((continents) => dispatch(continentsUpdate(continents)));
    api.emails.all().then((emails) => dispatch(emailsUpdate(emails)));
    api.profiles.current().then((profile) => dispatch(profileUpdate(profile)));
    api.app.status().then((resp) => dispatch(appStatusUpdate(resp)));

    // handle incoming e-mail notifications
    api.ipc.on(Constants.IPCRoute.EMAILS_NEW, (email: (typeof state.emails)[number]) => {
      dispatch(emailsUpdate([email]));

      // only send toast notifications if it wasn't
      // an accepted or rejected offer e-mail
      const [dialogue] = email.dialogues.slice(-1);

      if (!/(accepted|rejected)/gi.test(dialogue.content)) {
        toast((data) => <ToastEmail {...data} email={email} />);
      }
    });

    // handle incoming profile updates
    api.ipc.on(Constants.IPCRoute.PROFILES_CURRENT, (profile: typeof state.profile) =>
      dispatch(profileUpdate(profile)),
    );

    // setup app status heartbeat
    const heartbeat = setInterval(
      () => api.app.status().then((resp) => dispatch(appStatusUpdate(resp))),
      SETTINGS_VALIDATE_FREQUENCY,
    );
    return () => clearInterval(heartbeat);
  }, []);

  return (
    <React.StrictMode>
      <header className="navbar fixed top-0 z-50 h-16 border-b border-base-content/10 bg-base-200 p-0">
        <nav className="stack-x navbar-start h-full !gap-0">
          {[
            ['/', 'Dashboard'],
            ['/inbox', 'Inbox'],
            ['/squad', 'Squad Hub'],
            ['/search', 'Search'],
          ].map(([id, name]) => (
            <button
              key={id}
              className={cx(
                'btn relative h-full min-w-32 rounded-none border-b-2 shadow-none hover:border-b-primary',
                location.pathname === id && 'cursor-default border-b-primary bg-base-300',
              )}
              onClick={() => navigate(id)}
            >
              {name}
              {id.includes('inbox') && state.emails.some((email) => !email.read) && (
                <span className="badge-xxs badge badge-info absolute right-2 top-2" />
              )}
            </button>
          ))}
        </nav>
      </header>
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
  return (
    <AppStateProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'react-hot-toast',
        }}
      />
      <RouterProvider router={routes} />
    </AppStateProvider>
  );
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
  container.setAttribute('id', 'main');

  if (!container) {
    throw new Error('Failed to find the root element.');
  }

  // render the react application
  ReactDOM.createRoot(container).render(<Index />);
})();
