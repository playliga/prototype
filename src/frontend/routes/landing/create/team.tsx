/**
 * Collects team information when
 * user starts a new career.
 *
 * @module
 */
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { sample } from 'lodash';
import { Constants } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { windowDataUpdate } from '@liga/frontend/redux/actions';
import { AppState } from '@liga/frontend/redux/state';
import { useAudio, useTranslation } from '@liga/frontend/hooks';
import { FaFolderOpen, FaRecycle, FaUpload } from 'react-icons/fa';
import { CountrySelect, findCountryOptionByValue } from '@liga/frontend/components/select';

/**
 * Defines the form's initial values.
 *
 * @constant
 */
const formDefaultValues: AppState['windowData'][Constants.WindowIdentifier.Landing]['team'] = {
  name: '',
  countryId: undefined,
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
  const location = useLocation();
  const t = useTranslation('windows');
  const audioClick = useAudio('button-click.wav');
  const windowData = state.windowData.landing;

  // form setup
  const { control, formState, handleSubmit, register, setValue } = useForm({
    defaultValues: windowData?.team ? windowData.team : formDefaultValues,
    mode: 'all',
  });

  // load country data
  const countrySelectorData = React.useMemo(
    () =>
      state.continents.map((continent) => ({
        label: continent.name,
        options: continent.countries.map((country) => ({
          ...country,
          value: country.id,
          label: country.name,
        })),
      })),
    [state.continents],
  );

  // preload country if one was selected
  const selectedCountry = React.useMemo(() => {
    if (!windowData?.user?.countryId && !windowData?.team?.countryId) {
      return null;
    }

    if (windowData.user.countryId) {
      setValue('countryId', windowData.user.countryId);
    }

    return findCountryOptionByValue(
      countrySelectorData,
      windowData.user.countryId || windowData.team.countryId,
    );
  }, [countrySelectorData]);

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
  }, [blazonry, windowData]);

  // update window state everytime the blazon gets updated
  React.useEffect(() => {
    // save data to redux
    const data = {
      [Constants.WindowIdentifier.Landing]: {
        team: { ...windowData.team, blazon: teamBlazon },
      },
    };
    dispatch(windowDataUpdate(data));
  }, [teamBlazon]);

  // handle form submission
  const onSubmit = (team: typeof formDefaultValues) => {
    // save data to redux
    const data = {
      [Constants.WindowIdentifier.Landing]: {
        team: { ...team, blazon: teamBlazon },
      },
    };
    dispatch(windowDataUpdate(data));

    // move to next step in form
    const [currentStep] = location.pathname
      .split('/')
      .slice(-1)
      .map((path) => parseInt(path) || 1);
    navigate('/create/' + (currentStep + 1));
  };

  return (
    <div className="stack-y">
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
            onMouseDown={audioClick}
          >
            <FaRecycle />
          </button>
          <button
            title={t('shared.gallery')}
            className="btn btn-square btn-primary"
            onClick={() => navigate(location.pathname + '/gallery')}
            onMouseDown={audioClick}
          >
            <FaFolderOpen />
          </button>
          <button
            title="Upload Logo"
            className="btn btn-square btn-primary"
            onClick={() =>
              api.app
                .dialog(Constants.WindowIdentifier.Landing, {
                  properties: ['openFile'],
                  filters: [{ name: 'Images', extensions: ['jpg', 'png', 'svg'] }],
                })
                .then(
                  (dialogData) => !dialogData.canceled && api.app.upload(dialogData.filePaths[0]),
                )
                .then((file) => !!file && setTeamBlazon('uploads://' + file))
            }
            onMouseDown={audioClick}
          >
            <FaUpload />
          </button>
        </article>
      </section>
      <form className="stack-y">
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
        <section className="fieldset w-full">
          <label className="label">
            <span className="label-text">{t('shared.country')}</span>
          </label>
          <Controller
            name="countryId"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange } }) => (
              <CountrySelect
                defaultValue={selectedCountry}
                options={countrySelectorData}
                onChange={(option) => onChange(option.value)}
              />
            )}
          />
          <footer className="label h-5">
            <span className="label-text-alt">{formState.errors?.countryId?.message}</span>
          </footer>
        </section>
        <button
          type="submit"
          className="btn btn-primary btn-block"
          onClick={handleSubmit(onSubmit)}
          onMouseDown={audioClick}
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
    </div>
  );
}
