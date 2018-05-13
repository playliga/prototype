// @flow
import Competitor from './competitor';

class Division {
  name: string
  size: number
  conferenceSize: number
  competitors: Array<Competitor> = []
  conferences: Array<Conference>
  promotionPercent: number = 0.15

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

    this.conferences.forEach( ( conf: Conference ) => {
      const { groupObj } = conf;
      const topFour = groupObj.results().slice( 0, PLAYOFF_TOPN );

      // 1st place are automatically promoted and the next 3
      // are placed in the promotion playoffs
      PROMOTED.push( topFour[ 0 ] );
      topFour.slice( 1, PLAYOFF_TOPN ).forEach( i => PLAYOFFS.push( topFour[ i ] ) );
    });

    // split playoffs into PLAYOFF_PROMOTION_NUM
    // and create a playoff object for each one
    // TODO:

    // return
    return true;
  }
}

export default Division;