/** @type {ExtractBaseType} */
type ExtractBaseType<T> = T extends unknown[] ? T[number] : T;

/**
 * GitHub API comment response body.
 *
 * @interface
 */
interface GitHubCommentResponse {
  id: number;
  url: string;
  html_url: string;
  issue_url: string;
  user: {
    login: string;
    avatar_url: string;
    url: string;
    html_url: string;
    type: string;
  };
  created_at: string;
  updated_at: string;
  author_association: string;
  body: string;
  performed_via_github_app?: {
    id: number;
    slug: string;
    owner: {
      login: string;
      id: number;
      url: string;
      html_url: string;
      type: string;
      user_view_type: string;
    };
    name: string;
    description: string;
    html_url: string;
  };
}

/**
 * GitHub API issues response body.
 *
 * @interface
 */
interface GitHubIssueResponse {
  id: number;
  number: number;
  url: string;
  html_url: string;
  title: string;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string;
  }>;
  state: string;
  created_at: string;
  updated_at: string;
  comments: number;
  body: string;
  assignee?: {
    login: string;
    type: string;
  };
  type?: {
    id: number;
    name: string;
    description: string;
    color: string;
    is_enabled: true;
  };
}

/**
 * Mod's metadata file.
 *
 * @interface
 */
interface ModMetadata {
  name: string;
  author: string;
  version: string;
  description: string;
}

/**
 * This namespace contains the base tournament module and supporting data
 * structures that the groupstage and duel modules inherit from.
 *
 * It is named after the creator of these modules.
 *
 * @namespace
 */
declare namespace Clux {
  enum DuelBracketConfig {
    WB = 1,
    LB = 2,
  }

  interface DuelOptions {
    last?: DuelBracketConfig;
    short?: boolean;
  }

  interface GroupStageOptions {
    groupSize: number;
    meetTwice?: boolean;
  }

  interface MatchId {
    s: number;
    r: number;
    m: number;
  }

  interface Match {
    id: MatchId;
    p: [number, number];
    m: [number, number];
    data: Record<string, unknown>;
  }

  interface Result {
    draws: number;
    gpos: number;
    losses: number;
    pos: number;
    pts: number;
    seed: number;
    wins: number;
  }

  class Tournament {
    public static restore: (
      size: number,
      options: GroupStageOptions,
      state: unknown,
      metadata: unknown,
    ) => Tournament;
    public currentRound: (section?: number) => Match[];
    public findMatch: (matchId: MatchId) => Match;
    public findMatches: (idPartial: Partial<MatchId>) => Match[];
    public isDone: () => boolean;
    public metadata: () => unknown;
    public matches: Match[];
    public matchesFor: (seed: number) => Match[];
    public p?: number;
    public results: () => Result[];
    public resultsFor: (seed: number) => Result;
    public rounds: () => Match[][];
    public score: (matchId: MatchId, mapScore: unknown[]) => boolean;
    public sections: (round?: number) => Match[][];
    public standings?: Result[];
    public state: unknown[];
    public unscorable: (
      matchId: MatchId,
      mapScore: unknown[],
      allowPast?: boolean,
    ) => string | null;
    public upcoming: (seed: number) => Match[];
  }
}

/**
 * GroupStage is a simple and customizable, early stage tournament.
 *
 * A group stage is designed to pick out the best players by
 * first splitting them up in fair groups of requested size,
 * then round robin schedule each group.
 *
 * @module
 */
declare module 'groupstage' {
  export default class GroupStage extends Clux.Tournament {
    constructor(size: number, opts: GroupStageOptions);
    public static restore: (
      size: number,
      options: GroupStageOptions,
      state: unknown,
      metadata: unknown,
    ) => GroupStage;
    public groupFor: (seed: number) => number;
  }
}

/**
 * Duel elimination tournaments consist of two teams per match.
 *
 * After each match the winner is advanced to the right in the
 * bracket, and if loser bracket is in use, the loser
 * is put in the loser bracket.
 *
 * @module
 */
declare module 'duel' {
  export default class Duel extends Clux.Tournament {
    constructor(size: number, opts?: DuelOptions);
    public static restore: (
      size: number,
      options: DuelOptions,
      state: unknown,
      metadata: unknown,
    ) => Duel;
    public right: (matchId: MatchId) => [MatchId, number];
  }
}
