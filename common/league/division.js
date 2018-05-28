// @flow
import { findIndex, chunk, sortBy } from 'lodash';
import cuid from 'cuid';
import Duel from 'duel';
import Competitor from './competitor';

class Division {
  name: string
  size: number
  competitors: Array<Competitor> = []
  promotionPercent: number = 0.15
  conferenceSize: number
  conferences: Array<Conference>
  conferenceWinners: Array<Competitor> = []
  promotionConferences: Array<PromotionConference> = []
  promotionWinners: Array<Competitor> = []
  relegationBottomfeeders: Array<Competitor> = []

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

  startPostSeason = ( neighborPromotionNum: number = 0 ): boolean => {
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
    const PROMOTED = [];
    const PLAYOFFS = [];

    // how many are eligible for promotion
    const PROMOTION_NUM = Math.floor( this.size * this.promotionPercent );

    // how many will be relegated if neighbor promotion number arg was provided
    let bottomfeeders = [];
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
    // TODO: sort by pos? points? etc
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