/**
 * Collects user information when
 * user starts a new career.
 *
 * @module
 */
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { Constants } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { AppState } from '@liga/frontend/redux/state';
import { windowDataUpdate } from '@liga/frontend/redux/actions';
import { useTranslation } from '@liga/frontend/hooks';
import { CountrySelect, findCountryOptionByValue } from '@liga/frontend/components/select';

/**
 * Defines the form's default values.
 *
 * @constant
 */
const formDefaultValues: AppState['windowData'][Constants.WindowIdentifier.Landing]['user'] = {
  name: '',
  countryId: undefined,
};

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation('windows');
  const { state, dispatch } = React.useContext(AppStateContext);
  const windowData = state.windowData.landing;

  // form setup
  const { control, formState, handleSubmit, register } = useForm({
    defaultValues: windowData?.user ? windowData.user : formDefaultValues,
    mode: 'all',
  });

  // load country data
  const countrySelectorData = React.useMemo(() => {
    return state.continents.map((continent) => ({
      label: continent.name,
      options: continent.countries.map((country) => ({
        ...country,
        value: country.id,
        label: country.name,
      })),
    }));
  }, [state.continents]);

  // preload country if one was selected
  const selectedCountry = React.useMemo(() => {
    if (!windowData?.user?.countryId) {
      return null;
    }

    return findCountryOptionByValue(countrySelectorData, windowData.user.countryId);
  }, [countrySelectorData]);

  // handle form submission
  const onSubmit = (user: typeof formDefaultValues) => {
    // save data to redux
    const data = { [Constants.WindowIdentifier.Landing]: { user } };
    dispatch(windowDataUpdate(data));

    // move to next step in form
    const [currentStep] = location.pathname
      .split('/')
      .slice(-1)
      .map((path) => parseInt(path) || 1);
    navigate('/create/' + (currentStep + 1));
  };

  return (
    <form className="stack-y">
      <section className="fieldset w-full">
        <label className="label">
          <span className="label-text">{t('landing.create.alias')}</span>
        </label>
        <input
          {...register('name', { required: true, pattern: /^[\w]+$/, maxLength: 15 })}
          type="text"
          className={cx('input', 'w-full', !!formState.errors?.name?.type && 'input-error')}
        />
        <footer className="label h-5">
          <span className="label-text-alt">
            {formState.errors?.name?.type === 'required' && t('landing.create.requiredError')}
            {formState.errors?.name?.type === 'pattern' && t('landing.create.patternError')}
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
        disabled={
          !formState.isValid ||
          formState.isSubmitting ||
          (!formState.isDirty && formState.defaultValues === formDefaultValues)
        }
      >
        {!!formState.isSubmitting && <span className="loading loading-spinner"></span>}
        {t('landing.create.next')}
      </button>
    </form>
  );
}
