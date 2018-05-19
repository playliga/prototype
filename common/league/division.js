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
  promotionPercent: number = 0.15
  promotionConferences: Array<PromotionConference> = []

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

  isDone = (): boolean => {
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

  startPostSeason = (): boolean => {
    // abort if pending matches
    if( !this.isDone() ) {
      return false;
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
      PROMOTED.push( topn[ 0 ] );
      for( let index = 1; index < topn.length; index++ ) {
        PLAYOFFS.push( this.getCompetitorName( confNum, index ) );
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

    // return
    return true;
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
        const seedNum = index === 0 ? index + 1 : index;

        result = conf.groupObj.resultsFor( seedNum );
        break;
      }
    }

    return result;
  }

  getCompetitorName = ( confNum: number, index: number ): Competitor => {
    const { competitors } = this.conferences[ confNum ];
    return competitors[ index ];
  }
}

export default Division;