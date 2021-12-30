import GroupStage from 'groupstage';
import Duel from 'duel';
import { flatten, groupBy, sortBy } from 'lodash';
import { Competitor } from '../league';
import { Tournament } from '../league/types';


export default class Stage {
  public name: string;
  public size = 16;
  public groupSize = 4;
  public groupQualifyNum = 2;
  public meetTwice = false;
  public started = false;
  public playoffs = false;
  public competitors: Array<Competitor>;
  public playoffCompetitors: Array<Competitor>;
  public groupObj: Tournament;
  public duelObj: Tournament;

  // useful when dynamically restoring the class
  [k: string]: any;

  constructor( name: string, size?: number, groupSize?: number, playoffs?: boolean ) {
    this.name = name;
    this.size = size || this.size;
    this.groupSize = groupSize || this.groupSize;
    this.playoffs = playoffs || this.playoffs;
    this.competitors = [];
  }

  public static restore( args: Record<string, any> ) {
    const ins = new Stage( args.name );
    Object.keys( args ).forEach( k => ins[ k ] = args[ k ] );
    ins.groupObj = args.groupObj
      ? GroupStage.restore( args.competitors.length, { groupSize: args.groupSize }, args.groupObj.state, args.groupObj.metadata )
      : null
    ;
    ins.duelObj = args.duelObj
      ? Duel.restore( args.competitors.length, { short: true }, args.duelObj.state, args.duelObj.metadata )
      : null
    ;
    return ins;
  }

  public save() {
    const out = { ...this };

    if( this.groupObj ) {
      out.groupObj = {
        ...this.groupObj,
        metadata: this.groupObj.metadata()
      };
    }

    if( this.duelObj ) {
      out.duelObj = {
        ...this.duelObj,
        metadata: this.duelObj.metadata()
      };
    }

    return out;
  }

  public addCompetitor( id: number, name: string, tier: number ) {
    const comp = new Competitor( id, name, tier );
    this.competitors.push( comp );
  }

  public addCompetitors( competitorsStrArr: Competitor[] ) {
    const competitors = competitorsStrArr.map( i => new Competitor( i.id, i.name, i.tier ) );
    this.competitors = [ ...this.competitors, ...competitors ];
  }

  public removeCompetitor( id: number ) {
    this.competitors = this.competitors.filter( c => c.id !== id );
  }

  public getCompetitorBySeed( seed: number ) {
    return this.competitors[ seed - 1 ];
  }

  public start() {
    this.started = true;
    this.groupObj = new GroupStage(
      this.size,
      { groupSize: this.groupSize, meetTwice: this.meetTwice }
    );
  }

  public isDone() {
    // are there playoffs still left to be played?
    const groupStageDone = this.groupObj.isDone();

    if( this.playoffs && groupStageDone && !this.duelObj ) {
      // @todo: - handle tiebreakers and use Duel.from
      //        - https://www.npmjs.com/package/groupstage#tiebreaking
      const winners = flatten( this.getGroupWinners() );
      this.playoffCompetitors = winners.map( ctr => this.getCompetitorBySeed( ctr.seed ) );
      this.duelObj = new Duel( this.playoffCompetitors.length, { short: true });
      return false;
    }

    // are both groupstage and playoffs matches done?
    return groupStageDone && (
      this.playoffs
        ? this.duelObj.isDone()
        : true
    );
  }

  public getGroupResults() {
    const results = this.groupObj.results();
    const groups = groupBy( results, 'grp' );
    return Object
      .keys( groups )
      .map( gid => sortBy( groups[ gid ], 'gpos' ) )
    ;
  }

  public getGroupWinners() {
    return this
      .getGroupResults()
      .map( group => group.slice( 0, this.groupQualifyNum ) )
    ;
  }
}
