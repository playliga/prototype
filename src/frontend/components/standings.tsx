/**
 * Standings component.
 *
 * @module
 */
import cx from 'classnames';
import { compact, inRange } from 'lodash';
import { Eagers } from '@liga/shared';

/**
 * Promotion and relegation zone colors.
 *
 * @constant
 */
const ZoneColors = [
  'border-l-green-800', // automatic promotion
  'border-l-sky-800', // playoffs
  'border-l-red-800', // relegation
];

/**
 * @interface
 */
interface Props {
  competitors: Awaited<
    ReturnType<typeof api.competitions.all<typeof Eagers.competition>>
  >[number]['competitors'];
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
    <table className="table">
      {!!props.title && <caption>{props.title}</caption>}
      <thead>
        <tr>
          <th className="w-[10%]">
            <p title="Ranking">#</p>
          </th>
          <th className="w-[50%]">Name</th>
          <th className="w-[10%]">
            <p title="Win/Loss/Draw">W/L/D</p>
          </th>
          <th className="w-[10%]">
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
                'border-l-2',
                getZoneColorValue(idx + (props.offset || 0), props.zones) || 'border-l-transparent',
                props.onClick ? 'cursor-pointer' : 'cursor-default',
                competitor.team.id === props.highlight && 'bg-base-content/10',
              )}
              onClick={() => props.onClick && props.onClick(competitor)}
            >
              <td className="w-[10%]">{idx + 1 + (props.offset || 0)}.</td>
              <td className="w-[50%]">
                <p className="line-clamp-1" title={competitor.team.name}>
                  {!!competitor.team.blazon && (
                    <img
                      src={`resources://blazonry/${competitor.team.blazon}`}
                      className="mr-2 inline-block size-4"
                    />
                  )}
                  {competitor.team.name}
                </p>
              </td>
              <td className="w-[10%]">
                {competitor.win}/{competitor.loss}/{competitor.draw}
              </td>
              <td className="w-[10%]">{competitor.win * 3 + competitor.draw}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
