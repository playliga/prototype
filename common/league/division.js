// @flow
import Competitor from './competitor';

class Division {
  name: string
  size: number
  competitors: Array<Competitor> = []

  constructor( name: string, size: number = 256 ) {
    this.name = name;
    this.size = size;
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
}

export default Division;