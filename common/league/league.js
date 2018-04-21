// @flow
import { find, chunk } from 'lodash';
import cuid from 'cuid';
import GroupStage from 'groupstage';
import Division from './division';

class League {
  name: string
  divisions: Array<Division> = []

  constructor( name: string ) {
    this.name = name;
  }

  addDivision = ( name: string, size: number = 128, conferenceSize: number = 8 ) => {
    // TODO: first check that division does not already exist in array
    const div = new Division( name, size, conferenceSize );
    this.divisions.push( div );

    return div;
  }

  getDivision = ( name: string ) => {
    const div = find( this.divisions, item => item.name === name );
    return div;
  }

  start = () => {
    this.divisions.forEach( ( div: Division ) => {
      // keep a copy of the groupstage object and store into memory
      // groupstage lib makes each competitor face *all* others in same group.
      // so — split each division into "conferences" where each competitor only plays N matches
      const conferences = chunk( div.competitors, div.conferenceSize ).map( ( conf: Array<Competitor> ) => ({
        id: cuid(),
        competitors: conf,
        _rawGroupObj: new GroupStage( conf.length, { groupSize: div.conferenceSize })
      }) );
      div.setConferences( conferences );
    });
  }
}

export default League;