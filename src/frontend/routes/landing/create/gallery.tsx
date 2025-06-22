/**
 * Blazonry gallery.
 *
 * @module
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const windowData = state.windowData[Constants.WindowIdentifier.Landing];

  // load blazonry
  React.useEffect(() => {
    api.blazonry.all().then(setBlazonry);
  }, []);

  // assign team blazon if none found in window data
  React.useEffect(() => {
    if (!teamBlazon && windowData?.team?.blazon) {
      return setTeamBlazon(windowData?.team?.blazon);
    }

    if (!teamBlazon && blazonry[0]) {
      setTeamBlazon('resources://blazonry/' + blazonry[0]);
    }
  }, [blazonry, teamBlazon, windowData]);

  // logo selection handler
  const handleOnClick = React.useCallback(() => {
    const data = {
      [Constants.WindowIdentifier.Landing]: {
        team: { ...windowData.team, blazon: teamBlazon },
      },
    };
    dispatch(windowDataUpdate(data));
    navigate(-1);
  }, [teamBlazon]);

  if (!blazonry.length) {
    return (
      <section className="center h-full">
        <span className="loading loading-bars loading-lg" />
      </section>
    );
  }

  return (
    <section className="stack-y h-screen pt-32 pb-5">
      <article className="grid grid-cols-4 gap-4 overflow-y-scroll">
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
      </article>
      <article className="join">
        <button className="btn join-item flex-1" onClick={() => navigate(-1)}>
          {t('shared.cancel')}
        </button>
        <button className="btn join-item btn-primary flex-1" onClick={handleOnClick}>
          {t('shared.confirm')}
        </button>
      </article>
    </section>
  );
}
