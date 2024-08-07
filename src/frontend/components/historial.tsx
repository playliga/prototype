/**
 * Match historial of the last N-matches.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { format } from 'date-fns';
import { Constants, Eagers } from '@liga/shared';

/** @type {Match} */
type Match = Awaited<ReturnType<typeof api.matches.upcoming<typeof Eagers.match>>>[number];

/** @interface */
interface Props {
  matches: Array<Match>;
  teamId: number;
  className?: string;
}

/**
 * Exports this module.
 *
 * @param props Root props.
 * @exports
 */
export default function (props: Props) {
  const badgeStyle = 'badge badge-sm size-4 rounded-full';

  // fill in data until it meets the minimum
  const data = React.useMemo<typeof props.matches>(() => {
    if (props.matches.length < Constants.Application.SQUAD_MIN_LENGTH) {
      return [
        ...props.matches,
        ...Array(Constants.Application.SQUAD_MIN_LENGTH - props.matches.length),
      ];
    }

    return props.matches;
  }, [props.matches]);

  return (
    <div className={cx('stack-x !gap-1', props.className)}>
      {data.map((match, idx) => {
        if (!match) {
          return (
            <span
              key={idx + props.teamId + '__loading'}
              className={cx(badgeStyle, 'badge-outline')}
            />
          );
        }

        const result = match.competitors.find(
          (competitor) => competitor.teamId === props.teamId,
        )?.result;

        if (result === undefined) {
          return (
            <span
              key={match.id + props.teamId + '__loading'}
              className={cx(badgeStyle, 'badge-ghost')}
            />
          );
        }

        return (
          <span
            key={match.id + props.teamId + '__result'}
            title={
              ['Win on ', 'Draw on ', 'Loss on '][result] +
              format(match.date, Constants.Application.CALENDAR_DATE_FORMAT)
            }
            className={cx(badgeStyle, ['badge-success', 'badge-ghost', 'badge-error'][result])}
          />
        );
      })}
    </div>
  );
}
