/**
 * Edit user details modal.
 *
 * @module
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { Constants } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { FaUpload } from 'react-icons/fa';

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
  const { state } = React.useContext(AppStateContext);
  const [avatar, setAvatar] = React.useState<string>();
  const t = useTranslation('windows');

  // form setup
  const { formState, handleSubmit, register } = useForm({
    defaultValues: state.profile?.player.name
      ? { name: state.profile?.player.name }
      : formDefaultValues,
    mode: 'all',
  });

  // load avatar
  React.useEffect(() => {
    if (!avatar && state.profile?.player?.avatar) {
      return setAvatar(state.profile.player.avatar);
    }

    if (!avatar) {
      return setAvatar('resources://avatars/empty.png');
    }
  }, [avatar, state.profile]);

  // handle form submission
  const onSubmit = (user: typeof formDefaultValues) => {
    api.profiles
      .update({
        where: { id: state.profile.id },
        data: {
          settings: state.profile.settings,
          player: {
            update: {
              where: {
                id: state.profile.player.id,
              },
              data: {
                name: user.name,
                avatar,
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
          {avatar ? (
            <img src={avatar} className="h-32 w-auto" />
          ) : (
            <span className="loading loading-spinner loading-lg" />
          )}
        </article>
        <button
          title="Upload Avatar"
          className="btn btn-square btn-primary"
          onClick={() =>
            api.app
              .dialog(Constants.WindowIdentifier.Modal, {
                properties: ['openFile'],
                filters: [{ name: 'Images', extensions: ['jpg', 'png', 'svg'] }],
              })
              .then((dialogData) => !dialogData.canceled && api.app.upload(dialogData.filePaths[0]))
              .then((file) => !!file && setAvatar('uploads://' + file))
          }
        >
          <FaUpload />
        </button>
      </section>
      <form className="stack-y w-full">
        <section className="fieldset w-full">
          <label className="label">
            <span className="label-text">{t('shared.alias')}</span>
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
