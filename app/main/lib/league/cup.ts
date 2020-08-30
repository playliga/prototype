import { IterableObject } from 'shared/types';
import { Tournament } from './types';
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
    return {
      ...this,
      duelObj: {
        ...this.duelObj,
        metadata: this.duelObj.metadata()
      }
    };
  }

  public addCompetitor( id: number, name: string ) {
    const comp = new Competitor( id, name );
    this.competitors.push( comp );
  }

  public addCompetitors( competitorsStrArr: Competitor[] ) {
    const competitors = competitorsStrArr.map( i => new Competitor( i.id, i.name ) );
    this.competitors = [ ...this.competitors, ...competitors ];
  }

  public removeCompetitor( id: number ) {
    this.competitors = this.competitors.filter( c => c.id !== id );
  }

  public start() {
    this.started = true;
    this.duelObj = new Duel( this.competitors.length, { short: true });
  }

  public isDone() {
    if( !this.duelObj ) {
      return false;
    }

    return this.duelObj.isDone();
  }
}


export default Cup;
