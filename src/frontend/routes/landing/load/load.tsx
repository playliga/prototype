/**
 * Allows the user to load or delete a saved career.
 *
 * @module
 */
import React from 'react';
import { upperFirst } from 'lodash';
import { formatRelative } from 'date-fns';
import { useNavigate, Outlet } from 'react-router-dom';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const navigate = useNavigate();
  const { state } = React.useContext(AppStateContext);
  const t = useTranslation('windows');

  return (
    <main className="frosted center h-full w-2/5 p-5 xl:w-1/3">
      <FaArrowLeft
        className="absolute top-5 left-5 size-5 cursor-pointer"
        onClick={() => navigate(-1)}
      />
      <table className="table">
        <thead>
          <tr>
            <th>{t('shared.name')}</th>
            <th>{t('landing.load.lastUpdated')}</th>
            <th className="text-center">{t('shared.delete')}</th>
          </tr>
        </thead>
        <tbody>
          {state.profiles.map((profile) => (
            <tr
              key={profile.id}
              className="hover:bg-base-content/10 cursor-pointer"
              onClick={() => navigate('/connect/' + profile.id)}
            >
              <td>{profile.name}</td>
              <td>{upperFirst(formatRelative(profile.updatedAt, new Date()))}</td>
              <td className="text-center" onClick={(event) => event.stopPropagation()}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/load/delete/' + profile.id)}
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Outlet />
    </main>
  );
}
