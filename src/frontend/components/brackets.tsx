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
    color: 'oklch(var(--bc)/.10)',
    highlightedColor: 'oklch(var(--bc))',
  },
  matchBackground: {
    wonColor: 'oklch(var(--b2))',
    lostColor: 'oklch(var(--b2)/.10)',
  },
  roundHeaders: {
    background: 'oklch(var(--b2))',
  },
  score: {
    background: {
      wonColor: 'oklch(var(--b3))',
      lostColor: 'oklch(var(--b3))',
    },
    text: {
      highlightedWonColor: 'oklch(var(--in))',
      highlightedLostColor: 'oklch(var(--wa))',
    },
  },
  textColor: {
    main: 'oklch(var(--bc))',
    dark: 'oklch(var(--bc)/.50)',
    highlighted: 'oklch(var(--bc))',
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
            connectorColor: 'oklch(var(--bc)/.10)',
            connectorColorHighlight: 'oklch(var(--bc))',
            wonBywalkOverText: 'BYE',
            roundHeader: {
              fontColor: 'oklch(var(--bc))',
              roundTextGenerator: Util.parseCupRounds,
            },
          },
        }}
        svgWrapper={({ children, ...props }) => (
          <SVGViewer
            width={dimensions.width}
            height={dimensions.height}
            miniatureProps={{ position: 'none' }}
            SVGBackground="oklch(var(--b1))"
            {...props}
          >
            {children}
          </SVGViewer>
        )}
      />
    </div>
  );
}
