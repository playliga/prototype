/**
 * Brackets component.
 *
 * @module
 */
import React from 'react';
import Tournament from '@liga/shared/tournament';
import { format } from 'date-fns';
import { Constants, Eagers, Util } from '@liga/shared';
import {
  SingleEliminationBracket,
  Match,
  SVGViewer,
  MATCH_STATES,
  MatchType,
  createTheme,
} from '@g-loot/react-tournament-brackets/dist/esm';

/** @interface */
interface Props {
  matches: Awaited<ReturnType<typeof api.matches.all<typeof Eagers.match>>>;
}

/**
 * Brackets theme definition.
 *
 * @constant
 */
const theme = createTheme({
  border: {
    color: 'color-mix(in oklch, transparent 90%, var(--color-base-content))',
    highlightedColor: 'var(--color-base-content)',
  },
  matchBackground: {
    wonColor: 'var(--color-base-200)',
    lostColor: 'color-mix(in oklch, transparent 90%, var(--color-base-200))',
  },
  roundHeaders: {
    background: 'var(--color-base-200)',
  },
  score: {
    background: {
      wonColor: 'var(--color-base-300)',
      lostColor: 'var(--color-base-300)',
    },
    text: {
      highlightedWonColor: 'var(--color-info)',
      highlightedLostColor: 'var(--color-warning)',
    },
  },
  textColor: {
    main: 'var(--color-base-content)',
    dark: 'color-mix(in oklch, transparent 50%, var(--color-base-content))',
    highlighted: 'var(--color-base-content)',
  },
});

/**
 * Converts Prisma Matches object to data
 * expected by the brackets module.
 *
 * @param tourney The clux tournament object.
 * @param matches The Prisma matches data.
 * @function
 */
function toBracketsData(tourney: Tournament, matches: Props['matches']): MatchType[] {
  return matches.map((match) => {
    const [nextMatchId] = tourney.brackets.right(JSON.parse(match.payload)) || [];
    return {
      id: match.payload,
      nextMatchId: JSON.stringify(nextMatchId),
      startTime: format(match.date, Constants.Application.CALENDAR_DATE_FORMAT),
      tournamentRoundText: String(match.round),
      state: (() => {
        switch (match.status) {
          case Constants.MatchStatus.COMPLETED:
            return MATCH_STATES.SCORE_DONE;
          case Constants.MatchStatus.LOCKED:
            return MATCH_STATES.NO_PARTY;
          default:
            return null;
        }
      })(),
      participants: match.competitors.map((competitor) => ({
        id: competitor.team.id,
        name: competitor.team.name,
        isWinner: competitor.result === Constants.MatchResult.WIN,
        resultText: competitor.score !== null ? String(competitor.score) : null,
        status: (() => {
          switch (match.status) {
            case Constants.MatchStatus.COMPLETED:
              return competitor.score !== null ? MATCH_STATES.SCORE_DONE : MATCH_STATES.WALK_OVER;
            case Constants.MatchStatus.LOCKED:
              return MATCH_STATES.NO_PARTY;
            default:
              return null;
          }
        })(),
      })),
    };
  });
}

/**
 * Exports this module.
 *
 * @param props Root props.
 * @component
 * @exports
 */
export default function (props: Props) {
  // bail if no brackets data
  const tourney = Tournament.restore(JSON.parse(props.matches[0].competition.tournament));

  if (!tourney.brackets) {
    return null;
  }

  // grab the width and height of the parent component
  // dynamically to pass on to the canvas below
  const refWrapper = React.useRef<HTMLDivElement>();
  const [dimensions, setDimensions] = React.useState({
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    if (refWrapper.current) {
      setDimensions({
        width: refWrapper.current.offsetWidth,
        height: refWrapper.current.offsetHeight,
      });
    }
  }, []);

  return (
    <div ref={refWrapper} className="h-full w-full cursor-grab">
      <SingleEliminationBracket
        matches={toBracketsData(tourney, props.matches)}
        matchComponent={Match}
        theme={theme}
        options={{
          style: {
            connectorColor: 'color-mix(in oklch, transparent 90%, var(--color-base-content))',
            connectorColorHighlight: 'var(--color-base-content)',
            wonBywalkOverText: 'BYE',
            roundHeader: {
              fontColor: 'var(--color-base-content)',
              roundTextGenerator: Util.parseCupRounds,
            },
          },
        }}
        svgWrapper={({ children, ...props }) => (
          <SVGViewer
            width={dimensions.width}
            height={dimensions.height}
            miniatureProps={{ position: 'none' }}
            SVGBackground="var(--color-base-100)"
            {...props}
          >
            {children}
          </SVGViewer>
        )}
      />
    </div>
  );
}
