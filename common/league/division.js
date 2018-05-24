// @flow
import { findIndex, chunk } from 'lodash';
import cuid from 'cuid';
import Duel from 'duel';
import Competitor from './competitor';

class Division {
  name: string
  size: number
  conferenceSize: number
  competitors: Array<Competitor> = []
  conferences: Array<Conference>
  conferenceWinners: Array<Competitor> = []
  promotionPercent: number = 0.15
  promotionConferences: Array<PromotionConference> = []
  promotionWinners: Array<Competitor> = []

  constructor( name: string, size: number = 256, conferenceSize: number = 8 ) {
    this.name = name;
    this.size = size;
    this.conferenceSize = conferenceSize;
  }

  addCompetitor = ( name: string ): void => {
    // TODO: check if competitor already exists?
    const comp = new Competitor( name );
    this.competitors.push( comp );
  }

  addCompetitors = ( competitorsStrArr: Array<string> ): void => {
    const competitors = competitorsStrArr.map( name => new Competitor( name ) );
    this.competitors = [ ...this.competitors, ...competitors ];
  }

  setConferences = ( conferences: Array<Conference> ): void => {
    this.conferences = conferences;
  }

  getCompetitorGroupObj = ( name: string ): Object | null => {
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

  getCompetitorName = ( confNum: number, seedNum: number ): Competitor => {
    const { competitors } = this.conferences[ confNum ];
    return competitors[ seedNum - 1 ]; // seeds are 1-based; array is 0-based...
  }

  isGroupStageDone = (): boolean => {
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

  isDone = (): boolean => {
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

  startPostSeason = (): boolean => {
    // abort if pending matches
    if( !this.isGroupStageDone() ) {
      return false;
    }

    // if we have one conference then promotion is not possible
    // this means it's the top division
    if( this.conferences.length === 1 ) {
      const { groupObj } = this.conferences[ 0 ];
      const [ winner ] = groupObj.results();

      this.conferenceWinners.push( this.getCompetitorName( 0, winner.seed ) );
      return true;
    }

    // hold promoted and promotion playoff eligible arrays
    const PROMOTED = [];
    const PLAYOFFS = [];

    // how many are eligible for promotion
    const PROMOTION_NUM = Math.floor( this.size * this.promotionPercent );

    // 1st-place positions from each conference are eligible for
    // automatic promotion. the rest are from promotion playoffs
    const AUTOMATIC_PROMOTION_NUM = this.conferences.length;
    const PLAYOFF_PROMOTION_NUM = PROMOTION_NUM - AUTOMATIC_PROMOTION_NUM;

    // TOP-N positions from each conferences are eligible (2nd, 3rd, 4th; currently)
    // for the promotion playoffs
    const PLAYOFF_TOPN = 4; // should this be hardcoded?

    this.conferences.forEach( ( conf: Conference, confNum: number ) => {
      const { groupObj } = conf;
      const topn = groupObj.results().slice( 0, PLAYOFF_TOPN );

      // 1st place are automatically promoted and the next 3
      // are placed in the promotion playoffs
      PROMOTED.push( this.getCompetitorName( confNum, topn[ 0 ].seed ) );
      for( let index = 1; index < topn.length; index++ ) {
        PLAYOFFS.push( this.getCompetitorName( confNum, topn[ index ].seed ) );
      }
    });

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

    // copy over the promoted array to conferenceWinners array
    this.conferenceWinners = PROMOTED;

    // return
    return true;
  }

  endPostSeason = (): boolean => {
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