/**
 * Lists user's created issues.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Constants } from '@liga/shared';
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
const Badge = {
  [Status.OPEN]: 'badge-success',
  [Status.CLOSED]: 'badge-warning',
  [Type.BUG]: 'badge-warning',
  [Type.FEATURE]: 'badge-info',
};

/**
 * Renders a single issue table row.
 *
 * @param props The root props.
 * @function
 */
function Issue(props: GitHubIssueResponse & { onClick: () => void }) {
  return (
    <tr className="cursor-pointer last:border-b hover:bg-base-content/10" onClick={props.onClick}>
      <td className="truncate" title={props.title}>
        {props.title}
      </td>
      <td
        className="truncate capitalize"
        title={format(new Date(props.created_at), Constants.Application.CALENDAR_DATE_FORMAT)}
      >
        {formatDistanceToNow(new Date(props.created_at), { addSuffix: true })}
      </td>
      <td className="text-center">
        <span className={cx('badge', Badge[props.state as Status])}>
          {props.state.toLowerCase()}
        </span>
      </td>
      <td className="text-center">
        <span className={cx('badge', Badge[props.type.name.toLowerCase() as Type])}>
          {props.type.name.toLowerCase()}
        </span>
      </td>
      <td className="truncate text-center">
        {props.labels.map((label) => (
          <span
            key={label.id + '__label'}
            className="badge badge-success mr-1"
            style={{ backgroundColor: `#${label.color}` }}
          >
            {label.name.toLowerCase()}
          </span>
        ))}
      </td>
      <td className="text-center">
        <div className="stack-x items-center justify-center">
          <FaComment />
          {props.comments}
        </div>
      </td>
    </tr>
  );
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const navigate = useNavigate();
  const [issues, setIssues] = React.useState<Array<GitHubIssueResponse>>(null);

  React.useEffect(() => {
    api.issues.all().then(setIssues);
  }, []);

  if (!issues || issues.length === 0) {
    return (
      <main className="h-screen w-screen">
        <section className="center h-full">
          {!issues ? (
            <span className="loading loading-bars" />
          ) : (
            <span>You have no reported issues or feature requests.</span>
          )}
        </section>
      </main>
    );
  }

  return (
    <table className="table table-pin-rows table-sm table-fixed">
      <thead>
        <tr>
          <th>Title</th>
          <th>Created</th>
          <th className="text-center">Status</th>
          <th className="text-center">Type</th>
          <th className="text-center">Labels</th>
          <th className="text-center">Comments</th>
        </tr>
      </thead>
      <tbody>
        {issues.map((issue) => (
          <Issue
            {...issue}
            key={issue.id}
            onClick={() => navigate('/issues/comments', { state: issue.number })}
          />
        ))}
      </tbody>
    </table>
  );
}
