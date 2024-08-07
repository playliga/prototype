/**
 * Displays the landing page's start menu.
 *
 * @module
 */
import React from 'react';
import Logo from '@liga/frontend/assets/icon.png';
import { formatRelative } from 'date-fns';
import { upperFirst } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { AppStateContext } from '@liga/frontend/redux';
import { FaClock } from 'react-icons/fa';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const navigate = useNavigate();
  const { state } = React.useContext(AppStateContext);
  const [profile] = state.profiles;

  // build the action menu
  const actions = [
    { path: '/create', label: 'Start a New Career' },
    {
      path: '/load',
      label: 'Load Career',
      disabled: !state.profiles.length,
    },
  ];

  return (
    <main className="frosted center h-full w-2/5 p-5 xl:w-1/3">
      <header className="mb-5">
        <img src={Logo} className="size-32 object-cover" />
      </header>
      <nav className="menu w-full gap-2">
        {!!profile && (
          <section
            className="flex cursor-pointer items-center gap-5 bg-base-content/10 p-5 hover:bg-base-content/20"
            onClick={() => navigate('/connect/' + profile.id)}
          >
            <figure>
              <FaClock className="size-12" />
            </figure>
            <article className="stack-y w-full">
              <h2 className="text-lg">Continue</h2>
              <span className="divider mb-0 mt-0" />
              <aside>
                <p>{profile.name}</p>
                <p>
                  <em>{upperFirst(formatRelative(profile.updatedAt, new Date()))}</em>
                </p>
              </aside>
            </article>
          </section>
        )}
        {actions.map((item) => (
          <button
            key={item.path}
            disabled={item.disabled}
            onClick={() => navigate(item.path)}
            className="btn btn-ghost btn-md btn-block"
          >
            {item.label}
          </button>
        ))}
      </nav>
      <footer className="w-full">
        <span className="divider mb-0 mt-0" />
        <p>
          <small>{'v' + state.appInfo?.version}</small>
        </p>
      </footer>
    </main>
  );
}
