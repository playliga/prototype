/**
 * Report an issue or feature request forms.
 *
 * @module
 */
import * as Yup from 'yup';
import * as Constants from '@liga/shared/constants';
import React from 'react';
import cx from 'classnames';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

/** @interface */
interface GithubAPIResponse {
  html_url: string;
}

/** @constant */
const formDefaultValues = {
  type: Constants.IssueType.BUG,
  title: '',
  text: '',
  info: true,
  logs: true,
};

/** @constant */
const formValidationSchema = Yup.object({
  type: Yup.number().required(),
  title: Yup.string().required(),
  text: Yup.string().required(),
  info: Yup.bool().required(),
  logs: Yup.bool().required(),
});

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  // track response info
  const [apiResponse, setAPIResponse] = React.useState<GithubAPIResponse>();

  // form setup
  const { watch, register, formState, handleSubmit } = useForm({
    resolver: yupResolver(formValidationSchema.partial()),
    defaultValues: formDefaultValues,
    mode: 'all',
  });

  // set up watchers
  const type = Number(watch('type'));

  // handle form submission
  const onSubmit = (data: typeof formDefaultValues) => api.app.issue(data).then(setAPIResponse);

  return (
    <main>
      {!!apiResponse && (
        <dialog className="modal modal-open">
          <section className="modal-box">
            <h3 className="text-lg">
              Your {type === Constants.IssueType.BUG ? 'bug report' : 'feature'} has been filed
            </h3>
            <article className="prose max-w-none py-4">
              <p>Thank you for taking the time to file a bug report or feature request.</p>
              <p>To follow its progress please click the button below.</p>
            </article>
            <article className="modal-action">
              <button
                className="btn"
                onClick={() => api.window.close(Constants.WindowIdentifier.Modal)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => api.app.external(apiResponse.html_url)}
              >
                View
              </button>
            </article>
          </section>
        </dialog>
      )}
      <form className="form-ios h-full" onSubmit={handleSubmit(onSubmit)}>
        <fieldset>
          <legend>Overview</legend>
          <section>
            <header className="!col-span-1">
              <h3>Type</h3>
            </header>
            <article className="!col-span-2">
              <select className="select w-full" {...register('type')}>
                <option value={Constants.IssueType.BUG}>Bug Report</option>
                <option value={Constants.IssueType.FEATURE}>Feature Request</option>
              </select>
            </article>
          </section>
          <section>
            <header className="!col-span-1">
              <h3>Title</h3>
            </header>
            <article className="!col-span-2">
              <input
                type="text"
                placeholder="Please enter a title"
                className={cx('input w-full', formState.errors?.title && 'input-error')}
                {...register('title')}
              />
            </article>
          </section>
          <section className="gap-2">
            <header className="!col-span-3">
              {type === Constants.IssueType.BUG && (
                <React.Fragment>
                  <h3>Steps to Reproduce</h3>
                  <p>
                    A clear and concise description of what the bug is. Please share the steps to
                    reproduce and what the expected behavior is. If applicable, add screenshots to
                    help explain your problem. Markdown is supported. You will be able to edit your
                    issue and add screenshots after submission.
                  </p>
                </React.Fragment>
              )}
              {type === Constants.IssueType.FEATURE && (
                <React.Fragment>
                  <h3>Description</h3>
                  <p>
                    Please describe the feature you would like to see. A clear and concise
                    description of what you want to happen. Markdown is supported. You will be able
                    to edit your issue and add screenshots after submission.
                  </p>
                </React.Fragment>
              )}
            </header>
            <article className="!col-span-3">
              <textarea
                placeholder="Please enter details."
                className={cx('textarea h-64 w-full', formState.errors?.text && 'input-error')}
                {...register('text')}
              />
            </article>
          </section>
        </fieldset>
        {type === Constants.IssueType.BUG && (
          <fieldset>
            <legend>Support Data</legend>
            <section>
              <header>
                <h3>Include system information</h3>
                <p>Operating system, application version, etc.</p>
              </header>
              <article>
                <input type="checkbox" className="toggle" {...register('info')} />
              </article>
            </section>
            <section>
              <header>
                <h3>Include Logs</h3>
                <p>Application logs, game logs.</p>
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
            Submit
          </button>
        </section>
      </form>
    </main>
  );
}
