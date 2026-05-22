/**
 * Start a career with an existing team.
 *
 * @module
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Constants } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { windowDataUpdate } from '@liga/frontend/redux/actions';
import { useAudio, useTranslation } from '@liga/frontend/hooks';
import { TeamSelector } from '@liga/frontend/routes/landing/exhibition';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const { state, dispatch } = React.useContext(AppStateContext);
  const [selectedTeamId, setSelectedTeamId] = React.useState<number>();
  const navigate = useNavigate();
  const t = useTranslation('windows');
  const windowData = state.windowData[Constants.WindowIdentifier.Landing];

  // load audio files
  const audioRelease = useAudio('button-release.wav');
  const audioClick = useAudio('button-click.wav');

  // handle form submission
  const handleOnClick = React.useCallback(() => {
    const data = {
      [Constants.WindowIdentifier.Landing]: {
        team: { ...windowData.team, id: selectedTeamId },
      },
    };
    dispatch(windowDataUpdate(data));
    navigate('/create/3');
  }, [selectedTeamId]);

  return (
    <div className="stack-y h-screen pt-32 pb-5">
      <TeamSelector initialFederationId={1} initialTierId={4} onChange={setSelectedTeamId} />
      <section className="join">
        <button
          className="btn join-item flex-1"
          onClick={() => navigate(-1)}
          onMouseDown={audioRelease}
        >
          {t('shared.cancel')}
        </button>
        <button
          className="btn join-item btn-primary flex-1"
          disabled={!windowData.user?.name || !windowData.user?.countryId}
          onClick={handleOnClick}
          onMouseDown={audioClick}
        >
          {t('shared.confirm')}
        </button>
      </section>
    </div>
  );
}
