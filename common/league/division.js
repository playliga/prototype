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

    // how many are eligible for promotion
    const PROMOTION_NUM = this.size * this.promotionPercent;
    return true;
  }
}

export default Division;