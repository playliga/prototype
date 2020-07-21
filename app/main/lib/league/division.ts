import { findIndex, chunk, sortBy } from 'lodash';
import cuid from 'cuid';
import GroupStage from 'groupstage';
import Duel from 'duel';
import { IterableObject } from 'shared/types';
import Competitor from './competitor';
import { Conference, PromotionConference, Result } from './types';


class Division {
  public name: string;
  public size: number;
  public competitors: Array<Competitor> = [];
  public promotionPercent = 0.15;
  public conferenceSize: number;
  public conferences: Array<Conference> = [];
  public conferenceWinners: Array<Competitor> = [];
  public promotionConferences: Array<PromotionConference> = [];
  public promotionWinners: Array<Competitor> = [];
  public relegationBottomfeeders: Array<Competitor> = [];

  // useful when dynamically restoring the class
  [k: string]: any;

  constructor( name: string, size = 256, conferenceSize = 8 ) {
    this.name = name;
    this.size = size;
    this.conferenceSize = conferenceSize;
  }

  public static restore( args: IterableObject<any> ) {
    const ins = new Division( args.name );
    Object
      .keys( args )
      .forEach( k => ins[k] = args[k] )
    ;
    ins.conferences = args.conferences.map( ( c: Conference ) => ({
      ...c,
      groupObj: c.groupObj
        ? GroupStage.restore( c.competitors.length, { groupSize: args.conferenceSize }, c.groupObj.state )
        : null
    }));
    return ins;
  }

  public addCompetitor = ( id: number, name: string ): void => {
    // TODO check if competitor already exists?
    const comp = new Competitor( id, name );
    this.competitors.push( comp );
  }

  public addCompetitors = ( competitorsStrArr: Array<{id: number; name: string}> ): void => {
    const competitors = competitorsStrArr.map( i => new Competitor( i.id, i.name ) );
    this.competitors = [ ...this.competitors, ...competitors ];
  }

  public setConferences = ( conferences: Array<Conference> ): void => {
    this.conferences = conferences;
  }

  public getCompetitorGroupObj = ( name: string ): object | null => {
    const { conferences } = this;
    let result = null;

    for( let i = 0; i < conferences.length; i++ ) {
      // search the current conference's competitors
      const conf = conferences[ i ];
      const index = findIndex( conf.competitors, ( competitor: Competitor ) => competitor.name === name );

      if( index > -1 ) {
        // found! seeds start at 1 so bump if 0
        const seedNum = index + 1;

        result = conf.groupObj.resultsFor( seedNum );
        break;
      }
    }

    return result;
  }

  public getCompetitorName = ( confNum: number, seedNum: number ): Competitor => {
    const { competitors } = this.conferences[ confNum ];
    return competitors[ seedNum - 1 ]; // seeds are 1-based; array is 0-based...
  }

  public isGroupStageDone = (): boolean => {
    // loop through each conference and ensure all are done
    // bail on first false instance
    let done = true;

    // using a for loop here instead of Array.forEach
    // because the latter does not support `break`
    for( let i = 0; i < this.conferences.length; i++ ) {
      const { groupObj } = this.conferences[ i ];

      if( groupObj && !groupObj.isDone() ) {
        done = false;
        break;
      }
    }

    return done;
  }

  public isDone = (): boolean => {
    // bail early if group stage is not done
    if( !this.isGroupStageDone() ) {
      return false;
    }

    // loop through each promotion conference and ensure all are done
    // bail on first false instance
    let done = true;

    // using a for loop here instead of Array.forEach
    // because the latter does not support `break`
    for( let i = 0; i < this.promotionConferences.length; i++ ) {
      const { duelObj } = this.promotionConferences[ i ];

      if( duelObj && !duelObj.isDone() ) {
        done = false;
        break;
      }
    }

    // return
    return done;
  }

  public startPostSeason = ( neighborPromotionNum = 0 ): boolean => {
    // abort if pending matches
    if( !this.isGroupStageDone() ) {
      return false;
    }

    // if we have one conference then promotion is not possible
    // this means it's the top division
    if( this.conferences.length === 1 ) {
      const { groupObj } = this.conferences[ 0 ];
      const [ winner, ...otherStandings ] = groupObj.results();
      const BOTN = Math.ceil( neighborPromotionNum );

      this.conferenceWinners.push( this.getCompetitorName( 0, winner.seed ) );
      this.relegationBottomfeeders = otherStandings.slice( otherStandings.length - BOTN ).map( item => (
        this.getCompetitorName( 0, item.seed )
      ) );
      return true;
    }

    // hold promoted and promotion playoff eligible arrays
    const PROMOTED: Competitor[] = [];
    const PLAYOFFS: Competitor[] = [];

    // how many are eligible for promotion
    const PROMOTION_NUM = Math.floor( this.size * this.promotionPercent );

    // how many will be relegated if neighbor promotion number arg was provided
    let bottomfeeders: Array<{
      confNum: number;
      groupObj: Result;
    }> = [];
    const BOTN = neighborPromotionNum
      ? Math.ceil( neighborPromotionNum / this.conferences.length )
      : 0;

    // 1st-place positions from each conference are eligible for
    // automatic promotion. the rest are from promotion playoffs
    const AUTOMATIC_PROMOTION_NUM = this.conferences.length;
    const PLAYOFF_PROMOTION_NUM = PROMOTION_NUM - AUTOMATIC_PROMOTION_NUM;

    // TOP-N positions from each conference are eligible (2nd, 3rd, 4th; currently)
    // for the promotion playoffs
    const PLAYOFF_TOPN = 4; // should this be hardcoded?

    this.conferences.forEach( ( conf: Conference, confNum: number ) => {
      const standings = conf.groupObj.results();
      const topn = standings.slice( 0, PLAYOFF_TOPN );
      const bottomfeedersStandings = standings.slice( standings.length - BOTN );

      // 1st place are automatically promoted and the next 3
      // are placed in the promotion playoffs
      PROMOTED.push( this.getCompetitorName( confNum, topn[ 0 ].seed ) );
      for( let index = 1; index < topn.length; index++ ) {
        PLAYOFFS.push( this.getCompetitorName( confNum, topn[ index ].seed ) );
      }

      // the BOTN from each conference is compiled into one big array
      // for later to sort and trim if needed to match `neighborPromotionNum`
      bottomfeedersStandings.forEach( ( groupObj ) => {
        bottomfeeders.push({ confNum, groupObj });
      });
    });

    // sort and trim bottomfeeders to match `neighborPromotionNum`
    // TODO — sort by pos? points? etc
    if( bottomfeeders.length > neighborPromotionNum ) {
      bottomfeeders = sortBy( bottomfeeders, bottomfeeder => bottomfeeder.groupObj.pos ).reverse();
      bottomfeeders = bottomfeeders.slice( 0, neighborPromotionNum );
    }

    // and then add bottom feeders to relegation array
    this.relegationBottomfeeders = bottomfeeders.map( bottomfeeder => (
      this.getCompetitorName( bottomfeeder.confNum, bottomfeeder.groupObj.seed )
    ) );

    // split playoffs into conferences
    // for there to be 6 winners (PLAYOFF_PROMOTION_NUM)
    chunk(
      PLAYOFFS,
      PLAYOFFS.length / PLAYOFF_PROMOTION_NUM
    ).forEach( ( competitors: Array<Competitor> ) => {
      this.promotionConferences.push({
        id: cuid(),
        competitors,
        duelObj: new Duel( competitors.length, { short: true }) // no bronze final needed
      });
    });

    // add promoted players to conference winners array
    this.conferenceWinners = PROMOTED;

    // return
    return true;
  }

  public endPostSeason = (): boolean => {
    // bail early if group stage or playoffs are not done
    if( !this.isGroupStageDone() || !this.isDone() ) {
      return false;
    }

    // loop through each promotion conference and compile the list of winners
    this.promotionConferences.forEach( ( conf: PromotionConference ) => {
      const { competitors, duelObj } = conf;
      const [ winner ] = duelObj.results();

      // seeds are 1-based. arrays are 0-based
      this.promotionWinners.push( competitors[ winner.seed - 1 ] );
    });

    // return
    return true;
  }
}

export default Division;
