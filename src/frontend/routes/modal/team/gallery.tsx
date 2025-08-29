/**
 * Blazonry gallery.
 *
 * @module
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Constants } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { useTranslation } from '@liga/frontend/hooks';
import { AppStateContext } from '@liga/frontend/redux';
import { windowDataUpdate } from '@liga/frontend/redux/actions';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const { state, dispatch } = React.useContext(AppStateContext);
  const [blazonry, setBlazonry] = React.useState<string[]>([]);
  const [teamBlazon, setTeamBlazon] = React.useState('');
  const navigate = useNavigate();
  const t = useTranslation('windows');
  const windowData = state.windowData[Constants.WindowIdentifier.Modal];

  // load blazonry
  React.useEffect(() => {
    api.blazonry.all().then(setBlazonry);
  }, []);

  // assign team blazon if none found in window data
  React.useEffect(() => {
    if (!teamBlazon && windowData?.blazon) {
      return setTeamBlazon(windowData?.blazon);
    }

    if (!teamBlazon && blazonry[0]) {
      setTeamBlazon('resources://blazonry/' + blazonry[0]);
    }
  }, [blazonry, teamBlazon, windowData]);

  // logo selection handler
  const handleOnClick = React.useCallback(() => {
    dispatch(
      windowDataUpdate({
        [Constants.WindowIdentifier.Modal]: {
          blazon: teamBlazon,
        },
      }),
    );
    navigate(-1);
  }, [teamBlazon]);

  if (!blazonry.length) {
    return (
      <main className="h-screen w-screen">
        <section className="center h-full">
          <span className="loading loading-bars loading-lg" />
        </section>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full flex-col">
      <header className="breadcrumbs border-base-content/10 bg-base-200 sticky top-0 z-30 border-b px-2 text-sm">
        <ul>
          <li>
            <Link to="/team/edit">Edit Team Details</Link>
          </li>
          <li>Gallery</li>
        </ul>
      </header>
      <section className="grid h-0 flex-grow grid-cols-4 gap-4 overflow-x-auto">
        {blazonry.map((blazon) => {
          const src = 'resources://blazonry/' + blazon;
          return (
            <figure
              key={blazon}
              onClick={() => setTeamBlazon(src)}
              className={cx(
                'center cursor-pointer border',
                teamBlazon === src ? 'border-primary' : 'border-transparent',
              )}
            >
              <img src={src} className="h-16 w-auto" />
            </figure>
          );
        })}
      </section>
      <section className="join">
        <button
          className="btn join-item flex-1 rounded-none active:translate-0!"
          onClick={() => navigate(-1)}
        >
          {t('shared.cancel')}
        </button>
        <button
          className="btn join-item btn-primary flex-1 rounded-none active:translate-0!"
          onClick={handleOnClick}
        >
          {t('shared.confirm')}
        </button>
      </section>
    </main>
  );
}
