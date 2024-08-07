/**
 * Provides utilities, helpers, and typings necessary
 * to manage a tournament instance.
 *
 * @module
 */
import Duel from 'duel';
import GroupStage from 'groupstage';
import { groupBy, sortBy, uniq } from 'lodash';
import { BracketIdentifier } from './constants';

/**
 * Tournament class that wraps the group stage and duel modules and
 * provides a mapping between team ids and competitor seed numbers.
 *
 * @class
 */
export default class Tournament {
  public brackets: Duel;
  public competitors: Array<number>;
  public groups: GroupStage;
  public options: ConstructorParameters<typeof Tournament>['1'];
  public size: ConstructorParameters<typeof Tournament>['0'];

  constructor(size: number, options?: Clux.GroupStageOptions | Clux.DuelOptions) {
    this.size = size;
    this.competitors = [];
    this.options = options;
  }

  public static restore(data: ReturnType<Tournament['save']>) {
    let instance: Tournament;

    if (data.groups) {
      instance = new Tournament(data.groups.size, data.groups.options);
      instance.groups = GroupStage.restore(
        instance.size,
        data.groups.options,
        data.groups.state,
        data.groups.metadata,
      );
    } else {
      instance = new Tournament(data.brackets.size, data.brackets.options);
      instance.brackets = Duel.restore(
        instance.size,
        data.brackets.options,
        data.brackets.state,
        data.brackets.metadata,
      );
    }

    instance.addCompetitors(data.competitors);
    return instance;
  }

  public get $base() {
    return this.groups || this.brackets;
  }

  public get standings() {
    if (this.groups) {
      const standings = groupBy(this.groups.results(), 'grp');
      return Object.keys(standings).map((groupId) => sortBy(standings[groupId], 'gpos'));
    }

    return sortBy(this.brackets.results(), 'pos');
  }

  public addCompetitor(id: number) {
    this.competitors = uniq([...this.competitors, id]);
  }

  public addCompetitors(ids: Array<number>) {
    this.competitors = uniq([...this.competitors, ...ids]);
  }

  public getCompetitorBySeed(seed: number) {
    // seeds are not zero-based like
    // the competitors array index
    return this.competitors[seed - 1];
  }

  public getSeedByCompetitorId(id: number) {
    const idx = this.competitors.findIndex((competitor) => competitor === id);

    // seeds are not zero-based so bump the index by one
    return idx > -1 ? idx + 1 : null;
  }

  public getGroupByCompetitorId(id: number) {
    const seed = this.getSeedByCompetitorId(id);
    return this.groups?.groupFor(seed) || BracketIdentifier.UPPER;
  }

  public save() {
    if (this.groups) {
      return {
        competitors: this.competitors,
        groups: {
          metadata: this.groups.metadata(),
          options: this.options,
          size: this.size,
          state: this.groups.state.slice(),
        },
      };
    }

    return {
      competitors: this.competitors,
      brackets: {
        metadata: this.brackets.metadata(),
        options: this.options,
        size: this.size,
        state: this.brackets.state.slice(),
      },
    };
  }

  public start() {
    if ('groupSize' in this.options && this.options.groupSize) {
      this.groups = new GroupStage(this.size, this.options);
      return;
    }

    this.brackets = new Duel(this.size, this.options);
  }
}
