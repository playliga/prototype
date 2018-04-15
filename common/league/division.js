// @flow
import Competitor from './competitor';

class Division {
  name: string
  size: number
  conferenceSize: number
  competitors: Array<Competitor> = []
  conferences: Array<Conference>

  constructor( name: string, size: number = 256, conferenceSize: number = 8 ) {
    this.name = name;
    this.size = size;
    this.conferenceSize = conferenceSize;
  }

  addCompetitor = ( name: string ) => {
    // TODO: check if competitor already exists?
    const comp = new Competitor( name );
    this.competitors.push( comp );
  }

  addCompetitors = ( competitorsStrArr: Array<string> ) => {
    const competitors = competitorsStrArr.map( name => new Competitor( name ) );
    this.competitors = [ ...this.competitors, ...competitors ];
  }

  setConferences = ( conferences: Array<Conference> ) => {
    this.conferences = conferences;
  }
}

export default Division;