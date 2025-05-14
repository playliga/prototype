/**
 * Standings component.
 *
 * @module
 */
import React from 'react';
import { compact, inRange } from 'lodash';
import { Eagers } from '@liga/shared';
import { cx } from '@liga/frontend/lib';

/**
 * Promotion and relegation zone colors.
 *
 * @constant
 */
const ZoneColors = [
  'bg-green-800/10', // automatic promotion
  'bg-blue-800/10', // playoffs
  'bg-red-800/10', // relegation
];

/**
 * @interface
 */
interface Props {
  competitors: Awaited<
    ReturnType<typeof api.competitions.all<typeof Eagers.competition>>
  >[number]['competitors'];
  compact?: boolean;
  highlight?: number;
  limit?: number;
  offset?: number;
  title?: React.ReactNode;
  zones?: Array<number[]>;
  onClick?: (competitor: Props['competitors'][number]) => void;
}

/**
 * Gets the promotion and relegation color based off
 * of the provided zone config and positional value.
 *
 * @param value   The value of the position.
 * @param zones   The promotion/relegation zones config.
 * @function
 */
function getZoneColorValue(value: number, zones?: Props['zones']) {
  if (!zones) {
    return null;
  }

  // offsetting value by one because it is `0-based`
  // while the zones are `1-based`.
  //
  // additionally, offsetting the `end`
  // since `inRange` is exclusive
  return compact(
    zones.map((zone, zoneIdx) =>
      inRange(value + 1, zone[0], zone[1] + 1) ? ZoneColors[zoneIdx] : null,
    ),
  )[0];
}

/**
 * Exports this module.
 *
 * @param props Root props.
 * @component
 * @exports
 */
export default function (props: Props) {
  return (
    <table className="table table-fixed">
      {!!props.title && <caption>{props.title}</caption>}
      <thead>
        <tr>
          <th className="w-1/12">
            <p title="Ranking">#</p>
          </th>
          <th className="w-6/12">Name</th>
          {!!props.compact && (
            <th className="w-3/12">
              <p title="Win/Loss/Draw">W/L/D</p>
            </th>
          )}
          {!props.compact && (
            <React.Fragment>
              <th className="w-1/12 text-center">
                <p title="Win">Win</p>
              </th>
              <th className="w-1/12 text-center">
                <p title="Loss">Loss</p>
              </th>
              <th className="w-1/12 text-center">
                <p title="Draw">Draw</p>
              </th>
            </React.Fragment>
          )}
          <th className="w-2/12">
            <p title="Total Points">Pts.</p>
          </th>
        </tr>
      </thead>
      <tbody>
        {props.competitors
          .sort((a, b) => a.position - b.position)
          .slice(
            props.offset || 0,
            props.limit ? (props.offset || 0) + props.limit : props.competitors.length,
          )
          .map((competitor, idx) => (
            <tr
              key={competitor.team.id}
              className={cx(
                getZoneColorValue(idx + (props.offset || 0), props.zones),
                props.onClick ? 'cursor-pointer' : 'cursor-default',
                competitor.team.id === props.highlight && 'bg-base-content/10',
              )}
              onClick={() => props.onClick && props.onClick(competitor)}
            >
              <td>{idx + 1 + (props.offset || 0)}.</td>
              <td className="truncate">
                {!!competitor.team.blazon && (
                  <img src={competitor.team.blazon} className="mr-2 inline-block size-4" />
                )}
                {competitor.team.name}
              </td>
              {!!props.compact && (
                <td>
                  {competitor.win}/{competitor.loss}/{competitor.draw}
                </td>
              )}
              {!props.compact && (
                <React.Fragment>
                  <td className="text-center">{competitor.win}</td>
                  <td className="text-center">{competitor.loss}</td>
                  <td className="text-center">{competitor.draw}</td>
                </React.Fragment>
              )}
              <td>{competitor.win * 3 + competitor.draw}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
