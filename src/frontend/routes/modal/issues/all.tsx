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
import { useTranslation } from '@liga/frontend/hooks';

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
    <tr className="hover:bg-base-content/10 cursor-pointer last:border-b" onClick={props.onClick}>
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
  const t = useTranslation('windows');
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
            <span>{t('issues.all.noIssues')}</span>
          )}
        </section>
      </main>
    );
  }

  return (
    <table className="table-pin-rows table-sm table table-fixed">
      <thead>
        <tr>
          <th>{t('shared.title')}</th>
          <th>{t('shared.created')}</th>
          <th className="text-center">{t('shared.status')}</th>
          <th className="text-center">{t('shared.type')}</th>
          <th className="text-center">{t('shared.labels')}</th>
          <th className="text-center">{t('shared.comments')}</th>
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
