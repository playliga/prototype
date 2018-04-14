// @flow
import { find } from 'lodash';
import Division from './division';

class League {
  name: string
  divisions: Array<Division> = []

  constructor( name: string ) {
    this.name = name;
  }

  addDivision = ( name: string, size: number = 128 ) => {
    // TODO: first check that division does not already exist in array
    // TODO: return division once added
    const div = new Division( name, size );
    this.divisions.push( div );
  }

  getDivision = ( name: string ) => {
    const div = find( this.divisions, item => item.name === name );
    return div;
  }

  start = () => { // eslint-disable-line
    return true;
  }
}

export default League;