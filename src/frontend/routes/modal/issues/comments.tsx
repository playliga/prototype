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
            <Link to="/issues/all">My Reported Issues</Link>
          </li>
          <li>{issue.title}</li>
        </ul>
      </header>
      <table className="table">
        <thead>
          <tr>
            <th>Opened</th>
            <th>Assignee</th>
            <th className="text-center">Status</th>
            <th className="text-center">Type</th>
            <th className="text-center">Labels</th>
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
            <td>{issue.assignee?.login || 'Unassigned'}</td>
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
            <th>Details</th>
          </tr>
        </thead>
      </table>
      <section className="prose max-w-none border-b border-base-content/10 p-4">
        <ReactMarkdown children={issue.body} />
      </section>
      <table className="table">
        <thead>
          <tr>
            <th>Comments</th>
          </tr>
        </thead>
      </table>
      <section className="border-b border-base-content/10 p-4">
        {!comments.length && (
          <article className="center gap-5">
            <FaComment className="text-muted size-24" />
            <p>There are no comments yet.</p>
          </article>
        )}
        {comments.map((comment) => (
          <article
            key={comment.id}
            className={cx('chat', comment.performed_via_github_app ? 'chat-end' : 'chat-start')}
          >
            <header className="chat-header">
              {comment.performed_via_github_app ? 'You' : comment.user.login}
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
              <ReactMarkdown children={comment.body} />
            </aside>
            <footer className="chat-footer opacity-50">Delivered</footer>
          </article>
        ))}
      </section>
      <table className="table">
        <thead>
          <tr>
            <th>Add Comment</th>
          </tr>
        </thead>
      </table>
      <form className="form form-ios p-4" onSubmit={handleSubmit(onSubmit)}>
        <fieldset>
          <textarea
            placeholder="Markdown is supported."
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
          Submit
        </button>
      </form>
    </main>
  );
}
