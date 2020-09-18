import { shuffle } from 'lodash';
import { IterableObject } from 'shared/types';
import { Tournament, MatchId } from './types';
import Duel from 'duel';
import Competitor from './competitor';


class Cup {
  public name: string;
  public competitors: Array<Competitor> = [];
  public started = false;
  public duelObj: Tournament;

  // useful when dynamically restoring the class
  [k: string]: any;

  constructor( name: string ) {
    this.name = name;
  }

  public static restore( args: IterableObject<any> ) {
    const ins = new Cup( args.name );
    Object
      .keys( args )
      .forEach( k => ins[k] = args[k] )
    ;
    ins.duelObj = args.duelObj
      ? Duel.restore( args.competitors.length, { short: true }, args.duelObj.state, args.duelObj.metadata )
      : null
    ;
    return ins;
  }

  public save() {
    const out = { ...this };

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

  public getCompetitorSeedNumById( id: number ) {
    const idx = this.competitors.findIndex( c => c.id === id );

    // found! seeds start at 1 so bump if 0
    return idx > - 1
      ? idx + 1
      : -1;
  }

  public getCompetitorBySeed( seed: number ) {
    // seeds are 1-based; array is 0-based...
    return this.competitors[ seed - 1 ];
  }

  public start() {
    this.started = true;
    this.competitors = shuffle( this.competitors );
    this.duelObj = new Duel( this.competitors.length, { short: true });
  }

  public isDone() {
    if( !this.duelObj ) {
      return false;
    }

    return this.duelObj.isDone();
  }

  public matchesDone( idpartial: Partial<MatchId> ) {
    const matches = this.duelObj.findMatches( idpartial );
    return matches.every( m => Array.isArray( m.m ) );
  }
}


export default Cup;
