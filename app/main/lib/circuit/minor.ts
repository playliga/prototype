import { flatten } from 'lodash';
import Stage from './stage';


export default class Minor {
  public name: string;
  public started = false;
  public stages: Stage[];

  // useful when dynamically restoring the class
  [k: string]: any;

  constructor( name: string ) {
    this.name = name;
    this.stages = [];
  }

  public static restore( args: Record<string, any> ) {
    const ins = new Minor( args.name );
    Object.keys( args ).forEach( k => ins[k] = args[k] );
    ins.stages = args.stages.map( ( s: any ) => Stage.restore( s ) );
    return ins;
  }

  public save() {
    return {
      ...this,
      stages: this.stages.map( s => s.save() )
    };
  }

  public addStage( name: string, size: number, groupSize: number, playoffs = false ) {
    const stageObj = new Stage( name, size, groupSize, playoffs );
    this.stages.push( stageObj );
    return stageObj;
  }

  public start() {
    // start the first stage if we're just beginning
    if( !this.started ) {
      this.stages[ 0 ].start();
      this.started = true;
      return true;
    }

    // bail early if there are pending matches
    const prevStage = this.getCurrentStage();

    if( !prevStage.isDone() ) {
      return false;
    }

    // bail early if there are no pending stages
    const nextStage = this.stages.find( stage => !stage.started );

    if( !nextStage ) {
      return false;
    }

    // move prevstage winners to next stage
    // @todo: if playoffs, don't use this.
    flatten( prevStage.getGroupWinners() )
      .map( winner => prevStage.getCompetitorBySeed( winner.seed ) )
      .forEach( winner => nextStage.addCompetitor( winner.id, winner.name, winner.tier ) )
    ;

    // return true if there was an pending stage to start
    nextStage.start();
    return true;
  }

  public getCurrentStage() {
    // we want the latest stage that was started so we must first
    // slice the array and reverse it to not mutate the original
    return this.stages
      .slice()
      .reverse()
      .find( stage => stage.started )
    ;
  }

  public isDone() {
    return this.stages.every( stage => stage.isDone() );
  }
}
