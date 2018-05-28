// @flow
import { find, chunk, sortBy } from 'lodash';
import cuid from 'cuid';
import GroupStage from 'groupstage';
import Division from './division';

class League {
  name: string
  divisions: Array<Division> = []
  postSeasonDivisions: Array<Division> = []

  constructor( name: string ) {
    this.name = name;
  }

  addDivision = ( name: string, size: number = 128, conferenceSize: number = 8 ): Division => {
    // TODO: first check that division does not already exist in array
    const div = new Division( name, size, conferenceSize );
    this.divisions.push( div );

    return div;
  }

  getDivision = ( name: string ) => {
    const div = find( this.divisions, item => item.name === name );
    return div;
  }

  isGroupStageDone = (): boolean => {
    // loop through each division and ensure all are done
    // bail on first false instance
    let done = true;

    // using a for loop here instead of Array.forEach
    // because the latter does not support `break`
    for( let i = 0; i < this.divisions.length; i++ ) {
      const divObj = this.divisions[ i ];
      if( !divObj.isGroupStageDone() ) {
        done = false;
        break;
      }
    }

    return done;
  }

  isDone = (): boolean => {
    // loop through each division and ensure all are done
    // bail on first false instance
    let done = true;

    // using a for loop here instead of Array.forEach
    // because the latter does not support `break`
    for( let i = 0; i < this.divisions.length; i++ ) {
      const divObj = this.divisions[ i ];
      if( !divObj.isDone() ) {
        done = false;
        break;
      }
    }

    return done;
  }

  start = (): void => {
    this.divisions.forEach( ( div: Division ) => {
      // keep a copy of the groupstage object and store into memory
      // groupstage lib makes each competitor face *all* others in same group.
      // so — split each division into "conferences" where each competitor only plays N matches
      const conferences = chunk( div.competitors, div.conferenceSize ).map( ( conf: Array<Competitor> ) => ({
        id: cuid(),
        competitors: conf,
        groupObj: new GroupStage( conf.length, { groupSize: div.conferenceSize })
      }) );
      div.setConferences( conferences );
    });
  }

  startPostSeason = (): boolean => {
    let allDone = true;

    // start post-season for each individual division
    for( let i = 0; i < this.divisions.length; i++ ) {
      const divObj = this.divisions[ i ];
      const neighbor = this.divisions[ i - 1 ] || null;

      // bail on first instance of an unfinished division
      if( !divObj.isGroupStageDone() ) {
        allDone = false;
        break;
      }

      // pass on how many will be moving up from the previous division
      // to compile the list of relegated competitors
      const neighborPromotionNum = neighbor
        ? neighbor.conferenceWinners.length + neighbor.promotionConferences.length
        : 0;

      divObj.startPostSeason( neighborPromotionNum );
    }

    return allDone;
  }

  endPostSeason = (): boolean => {
    let allDone = true;

    // end post-season for each division
    for( let i = 0; i < this.divisions.length; i++ ) {
      const divObj = this.divisions[ i ];

      // bail on first instance of an unfinished division
      if( !divObj.isGroupStageDone() || !divObj.isDone() ) {
        allDone = false;
        break;
      }

      divObj.endPostSeason();
    }

    return allDone;
  }

  end = (): void => {
    // OPEN(256, 32, 8) = 38 move up
    // INTERMEDIATE(128, 16, 8) = 38 move down, 19 move up
    // MAIN(64, 8, 8) = 19 move down, 10 move up
    // PREMIER(32, 4, 8) = 10 move down, 5 move up
    // INVITE = 5 move down
    this.divisions.forEach( ( division: Division, index: number ) => {
      // bail if top division in the league
      const neighbor = this.divisions[ index + 1 ];

      if( !neighbor ) {
        return;
      }

      // pull relegation bottomfeeders from neighbor division into new division
      const newDivision = new Division( division.name, division.conferenceSize );
      newDivision.addCompetitors( neighbor.relegationBottomfeeders.map( ( bottomfeeder: Competitor ) => bottomfeeder.name ) );

      // copy everyone but the topn that were pushed into new neighbor division
      newDivision.addCompetitors( division.competitors.filter( ( comp: Competitor ) => {
        const directPromoted = division.conferenceWinners.find( ( winner: Competitor ) => winner.name === comp.name );
        const playoffPromoted = division.promotionWinners.find( ( winner: Competitor ) => winner.name === comp.name );

        return directPromoted === undefined
          && playoffPromoted === undefined;
      }).map( ( comp: Competitor ) => comp.name ) );

      // push current division winners into new neighbor division
      const newNeighbor = new Division( neighbor.name, neighbor.conferenceSize );
      newNeighbor.addCompetitors( division.conferenceWinners.map( ( comp: Competitor ) => comp.name ) );
      newNeighbor.addCompetitors( division.promotionWinners.map( ( comp: Competitor ) => comp.name ) );

      // copy everyone but the relegation bottomfeeders to the new neighbor division
      newNeighbor.addCompetitors( neighbor.competitors.filter( ( comp: Competitor ) => {
        const bottomfeederFound = neighbor.relegationBottomfeeders.find( ( bottomfeeder: Competitor ) => (
          bottomfeeder.name === comp.name
        ) );

        return bottomfeederFound === undefined;
      }).map( ( comp: Competitor ) => comp.name ) );

      console.log( newDivision.name, newDivision.competitors.length );
    });
  }
}

export default League;