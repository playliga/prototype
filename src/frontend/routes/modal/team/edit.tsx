/**
 * Edit team details modal.
 *
 * @module
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { sample } from 'lodash';
import { Constants } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { windowDataUpdate } from '@liga/frontend/redux/actions';
import { useTranslation } from '@liga/frontend/hooks';
import { FaFolderOpen, FaRecycle, FaUpload } from 'react-icons/fa';

/**
 * Defines the form's initial values.
 *
 * @constant
 */
const formDefaultValues = {
  name: '',
};

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

  // form setup
  const { formState, handleSubmit, register } = useForm({
    defaultValues: state.profile?.team.name
      ? { name: state.profile?.team.name }
      : formDefaultValues,
    mode: 'all',
  });

  // load blazonry
  React.useEffect(() => {
    api.blazonry.all().then(setBlazonry);
  }, []);

  // assign team blazon if none found in window data
  React.useEffect(() => {
    if (!teamBlazon && windowData?.blazon) {
      return setTeamBlazon(windowData?.blazon);
    }

    if (!teamBlazon && !!state.profile) {
      return setTeamBlazon(state.profile.team.blazon);
    }

    if (!teamBlazon && blazonry[0]) {
      setTeamBlazon('resources://blazonry/' + blazonry[0]);
    }
  }, [blazonry, state.profile, windowData]);

  // update window state everytime the blazon gets updated
  React.useEffect(() => {
    dispatch(
      windowDataUpdate({
        [Constants.WindowIdentifier.Modal]: {
          ...windowData,
          blazon: teamBlazon,
        },
      }),
    );
  }, [teamBlazon]);

  // handle form submission
  const onSubmit = (team: typeof formDefaultValues) => {
    api.profiles
      .update({
        where: { id: state.profile.id },
        data: {
          settings: state.profile.settings,
          team: {
            update: {
              where: {
                id: state.profile.team.id,
              },
              data: {
                name: team.name,
                blazon: windowData?.blazon || teamBlazon,
              },
            },
          },
        },
      })
      .then(() => api.window.close(Constants.WindowIdentifier.Modal));
  };

  if (!state.profile) {
    return (
      <main className="h-screen w-screen">
        <section className="center h-full">
          <span className="loading loading-bars loading-lg" />
        </section>
      </main>
    );
  }

  return (
    <main className="center mx-auto h-screen w-1/2 gap-4">
      <section className="stack-y items-center gap-4!">
        <article className="center h-32 w-auto">
          {teamBlazon ? (
            <img src={teamBlazon} className="h-32 w-auto" />
          ) : (
            <span className="loading loading-spinner loading-lg" />
          )}
        </article>
        <article className="stack-x">
          <button
            title={t('shared.randomize')}
            className="btn btn-square btn-primary"
            disabled={!teamBlazon}
            onClick={() => setTeamBlazon('resources://blazonry/' + sample(blazonry))}
          >
            <FaRecycle />
          </button>
          <button
            title={t('shared.gallery')}
            className="btn btn-square btn-primary"
            onClick={() => navigate('/team/gallery')}
          >
            <FaFolderOpen />
          </button>
          <button
            title="Upload Logo"
            className="btn btn-square btn-primary"
            onClick={() =>
              api.app
                .dialog(Constants.WindowIdentifier.Modal, {
                  properties: ['openFile'],
                  filters: [{ name: 'Images', extensions: ['jpg', 'png', 'svg'] }],
                })
                .then(
                  (dialogData) => !dialogData.canceled && api.app.upload(dialogData.filePaths[0]),
                )
                .then((file) => !!file && setTeamBlazon('uploads://' + file))
            }
          >
            <FaUpload />
          </button>
        </article>
      </section>
      <form className="stack-y w-full">
        <section className="fieldset w-full">
          <label className="label">
            <span className="label-text">{t('shared.teamName')}</span>
          </label>
          <input
            {...register('name', { required: 'Required', pattern: /^[\w]+$/, maxLength: 15 })}
            type="text"
            className={cx('input', 'w-full', !!formState.errors?.name?.type && 'input-error')}
          />
          <footer className="label h-5">
            <span className="label-text-alt">
              {formState.errors?.name?.type === 'required' && t('shared.required')}
              {formState.errors?.name?.type === 'pattern' && t('shared.specialCharactersError')}
            </span>
          </footer>
        </section>
        <button
          type="submit"
          className="btn btn-primary btn-block"
          onClick={handleSubmit(onSubmit)}
          disabled={
            !formState.isValid ||
            formState.isSubmitting ||
            (!formState.isDirty && formState.defaultValues === formDefaultValues)
          }
        >
          {!!formState.isSubmitting && <span className="loading loading-spinner"></span>}
          {t('shared.finish')}
        </button>
      </form>
    </main>
  );
}
