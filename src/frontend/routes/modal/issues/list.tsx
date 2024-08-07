/**
 * Lists user's created issues.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { formatRelative } from 'date-fns';
import { FaExternalLinkAlt } from 'react-icons/fa';

/** @enum */
enum State {
  OPEN = 'open',
  CLOSED = 'closed',
}

/** @constant */
const StateTypes = {
  [State.OPEN]: 'badge-success',
  [State.CLOSED]: 'badge-warning',
};

/**
 * Renders a single issue table row.
 *
 * @param props The root props.
 * @function
 */
function Issue(props: GitHubIssueResponse) {
  const date = formatRelative(new Date(props.created_at), Date.now());

  return (
    <tr
      className="cursor-pointer last:border-b hover:bg-base-content/10"
      onClick={() => api.app.external(props.html_url)}
    >
      <td className="truncate" title={props.title}>
        {props.title}
      </td>
      <td className="truncate capitalize" title={date}>
        {date}
      </td>
      <td className="truncate">
        {props.labels.map((label) => (
          <span
            key={label.id + '__label'}
            className="badge badge-success badge-sm mr-1 capitalize"
            style={{ backgroundColor: `#${label.color}` }}
          >
            {label.name}
          </span>
        ))}
      </td>
      <td className="text-center">
        <span className={cx('badge badge-sm w-full capitalize', StateTypes[props.state as State])}>
          {props.state}
        </span>
      </td>
      <td className="center">
        <FaExternalLinkAlt />
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
    <table className="table table-pin-rows table-xs table-fixed">
      <thead>
        <tr>
          <th className="w-4/12">Title</th>
          <th className="w-2/12">Created</th>
          <th className="w-4/12">Labels</th>
          <th className="w-1/12 text-center">Status</th>
          <th title="Open Link" className="w-1/12" />
        </tr>
      </thead>
      <tbody>
        {issues.map((issue) => (
          <Issue key={issue.id} {...issue} />
        ))}
      </tbody>
    </table>
  );
}
