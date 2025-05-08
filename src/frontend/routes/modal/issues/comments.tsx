/**
 * Issue comment thread.
 *
 * @module
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import cx from 'classnames';
import { format, formatDistanceToNow } from 'date-fns';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router-dom';
import { Constants } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { FaComment } from 'react-icons/fa';

/** @enum */
enum Status {
  OPEN = 'open',
  CLOSED = 'closed',
}

/** @enum */
enum Type {
  BUG = 'bug',
  FEATURE = 'feature',
}

/** @constant */
const formDefaultValues = {
  body: '',
};

/** @constant */
const Badge = {
  [Status.OPEN]: 'badge-success',
  [Status.CLOSED]: 'badge-warning',
  [Type.BUG]: 'badge-warning',
  [Type.FEATURE]: 'badge-info',
};

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const location = useLocation();
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [comments, setComments] = React.useState<Array<GitHubCommentResponse>>([]);
  const [issue, setIssue] = React.useState<GitHubIssueResponse>();

  // form setup
  const { formState, handleSubmit, register, reset } = useForm({
    defaultValues: formDefaultValues,
    mode: 'all',
  });

  // handle form submission
  const onSubmit = (data: typeof formDefaultValues) =>
    api.issues
      .createComment(issue.number, data)
      .then(() => api.issues.comments(issue.number))
      .then(setComments);

  React.useEffect(() => {
    if (!location.state || !state.profile) {
      return;
    }

    Promise.all([
      api.issues.find(location.state as number),
      api.issues.comments(location.state as number),
    ]).then((data) => {
      setIssue(data[0]);
      setComments(data[1]);
    });
  }, []);

  React.useEffect(() => {
    reset();
  }, [comments]);

  if (!issue) {
    return (
      <main className="h-screen w-screen">
        <section className="center h-full">
          <span className="loading loading-bars" />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="breadcrumbs sticky top-0 z-30 border-b border-base-content/10 bg-base-200 px-2 text-sm">
        <ul>
          <li>
            <Link to="/issues/all">{t('issues.comments.myReportedIssues')}</Link>
          </li>
          <li>{issue.title}</li>
        </ul>
      </header>
      <table className="table">
        <thead>
          <tr>
            <th>{t('shared.created')}</th>
            <th>{t('issues.comments.assignee')}</th>
            <th className="text-center">{t('shared.status')}</th>
            <th className="text-center">{t('shared.type')}</th>
            <th className="text-center">{t('shared.labels')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <time
                className="capitalize"
                title={format(
                  new Date(issue.created_at),
                  Constants.Application.CALENDAR_DATE_FORMAT,
                )}
              >
                {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
              </time>
            </td>
            <td>{issue.assignee?.login || t('issues.comments.unassigned')}</td>
            <td className="text-center">
              <span className={cx('badge', Badge[issue.state as Status])}>
                {issue.state.toLowerCase()}
              </span>
            </td>
            <td className="text-center">
              <span className={cx('badge', Badge[issue.type.name.toLowerCase() as Type])}>
                {issue.type.name.toLowerCase()}
              </span>
            </td>
            <td className="text-center">
              {issue.labels.map((label) => (
                <span
                  key={label.id + '__label'}
                  className="badge badge-success mr-1"
                  style={{ backgroundColor: `#${label.color}` }}
                >
                  {label.name.toLowerCase()}
                </span>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
      <table className="table">
        <thead>
          <tr>
            <th>{t('shared.details')}</th>
          </tr>
        </thead>
      </table>
      <section className="prose max-w-none border-b border-base-content/10 p-4">
        <ReactMarkdown>{issue.body}</ReactMarkdown>
      </section>
      <table className="table">
        <thead>
          <tr>
            <th>{t('shared.comments')}</th>
          </tr>
        </thead>
      </table>
      <section className="border-b border-base-content/10 p-4">
        {!comments.length && (
          <article className="center gap-5">
            <FaComment className="text-muted size-24" />
            <p>{t('issues.comments.noComments')}</p>
          </article>
        )}
        {comments.map((comment) => (
          <article
            key={comment.id}
            className={cx('chat', comment.performed_via_github_app ? 'chat-end' : 'chat-start')}
          >
            <header className="chat-header">
              {comment.performed_via_github_app ? t('issues.comments.you') : comment.user.login}
              <time
                className="ml-2 text-xs opacity-50"
                title={format(
                  new Date(comment.created_at),
                  Constants.Application.CALENDAR_DATE_FORMAT,
                )}
              >
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </time>
            </header>
            <aside className="prose chat-bubble">
              <ReactMarkdown>{comment.body}</ReactMarkdown>
            </aside>
            <footer className="chat-footer opacity-50">{t('issues.comments.delivered')}</footer>
          </article>
        ))}
      </section>
      <table className="table">
        <thead>
          <tr>
            <th>{t('issues.comments.addComment')}</th>
          </tr>
        </thead>
      </table>
      <form className="form form-ios p-4" onSubmit={handleSubmit(onSubmit)}>
        <fieldset>
          <textarea
            placeholder={t('issues.comments.markdown')}
            className={cx(
              'placeholder:text-muted textarea h-64 w-full',
              formState.errors?.body && 'input-error',
            )}
            {...register('body')}
          />
        </fieldset>
        <button
          type="submit"
          className="btn btn-primary btn-block mt-4"
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
      </form>
    </main>
  );
}
