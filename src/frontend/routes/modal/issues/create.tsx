/**
 * Report an issue or feature request forms.
 *
 * @module
 */
import * as Constants from '@liga/shared/constants';
import React from 'react';
import cx from 'classnames';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@liga/frontend/hooks';

/** @constant */
const formDefaultValues = {
  type: Constants.IssueType.BUG,
  title: '',
  text: '',
  info: true,
  logs: true,
};

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  // track response info
  const navigate = useNavigate();
  const t = useTranslation('windows');
  const [apiResponse, setAPIResponse] = React.useState<GitHubIssueResponse>();

  // form setup
  const { watch, register, formState, handleSubmit } = useForm({
    defaultValues: formDefaultValues,
    mode: 'all',
  });

  // set up watchers
  const type = Number(watch('type'));

  // handle form submission
  const onSubmit = (data: typeof formDefaultValues) => api.issues.create(data).then(setAPIResponse);

  return (
    <main>
      {!!apiResponse && (
        <dialog className="modal modal-open">
          <section className="modal-box">
            <h3 className="text-lg">
              {t('issues.create.your')}&nbsp;
              {type === Constants.IssueType.BUG
                ? t('issues.create.bugReport')
                : t('issues.create.featureRequest')}
              &nbsp;
              {t('issues.create.beenFiled')}
            </h3>
            <article className="prose max-w-none py-4">
              <p>{t('issues.create.thanksTitle')}</p>
              <p>{t('issues.create.thanksSubtitle')}</p>
            </article>
            <article className="modal-action">
              <button
                className="btn"
                onClick={() => api.window.close(Constants.WindowIdentifier.Modal)}
              >
                {t('issues.create.close')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/issues/comments', { state: apiResponse.number })}
              >
                {t('issues.create.view')}
              </button>
            </article>
          </section>
        </dialog>
      )}
      <form className="form-ios h-full" onSubmit={handleSubmit(onSubmit)}>
        <fieldset>
          <legend>{t('shared.overview')}</legend>
          <section>
            <header className="col-span-1!">
              <p>{t('shared.type')}</p>
            </header>
            <article className="col-span-2!">
              <select className="select w-full" {...register('type')}>
                <option value={Constants.IssueType.BUG}>{t('issues.create.bugReport')}</option>
                <option value={Constants.IssueType.FEATURE}>
                  {t('issues.create.featureRequest')}
                </option>
              </select>
            </article>
          </section>
          <section>
            <header className="col-span-1!">
              <p>{t('shared.title')}</p>
            </header>
            <article className="col-span-2!">
              <input
                type="text"
                placeholder={t('issues.create.titlePlaceholder')}
                className={cx('input w-full', formState.errors?.title && 'input-error')}
                {...register('title')}
              />
            </article>
          </section>
          <section className="gap-2">
            <header className="col-span-3!">
              {type === Constants.IssueType.BUG && (
                <React.Fragment>
                  <p>{t('issues.create.stepsTitle')}</p>
                  <p>{t('issues.create.stepsSubtitle')}</p>
                </React.Fragment>
              )}
              {type === Constants.IssueType.FEATURE && (
                <React.Fragment>
                  <p>{t('shared.description')}</p>
                  <p>{t('issues.create.descriptionSubtitle')}</p>
                </React.Fragment>
              )}
            </header>
            <article className="col-span-3!">
              <textarea
                placeholder={t('issues.create.detailsPlaceholder')}
                className={cx('textarea h-64 w-full', formState.errors?.text && 'input-error')}
                {...register('text')}
              />
            </article>
          </section>
        </fieldset>
        {type === Constants.IssueType.BUG && (
          <fieldset>
            <legend>{t('issues.create.supportDataTitle')}</legend>
            <section>
              <header>
                <p>{t('issues.create.systemInfoTitle')}</p>
                <p>{t('issues.create.systemInfoSubtitle')}</p>
              </header>
              <article>
                <input type="checkbox" className="toggle" {...register('info')} />
              </article>
            </section>
            <section>
              <header>
                <p>{t('issues.create.logsTitle')}</p>
                <p>{t('issues.create.logsSubtitle')}</p>
              </header>
              <article>
                <input type="checkbox" className="toggle" {...register('logs')} />
              </article>
            </section>
          </fieldset>
        )}
        <section className="p-2">
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={
              !formState.isValid ||
              formState.isSubmitting ||
              formState.isSubmitted ||
              (!formState.isDirty && formState.defaultValues === formDefaultValues)
            }
          >
            {!!formState.isSubmitting && <span className="loading loading-spinner"></span>}
            {t('shared.submit')}
          </button>
        </section>
      </form>
    </main>
  );
}
