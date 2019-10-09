// @flow
import { find, chunk } from 'lodash';
import cuid from 'cuid';
import GroupStage from 'groupstage';
import Division from './division';
import Competitor from './competitor';


class League {
  name: string
  divisions: Array<Division> = []
  postSeasonDivisions: Array<Division> = []

  constructor( name: string ) {
    this.name = name;
  }

  addDivision = ( name: string, size = 128, conferenceSize = 8 ): Division => {
    // TODO — first check that division does not already exist in array
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
      const conferences = chunk( div.competitors, div.conferenceSize ).map( ( conf: Competitor[] ) => ({
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
    this.divisions.forEach( ( currentDivision: Division, index: number ) => {
      const prevDivision = this.divisions[ index - 1 ];
      const nextDivision = this.divisions[ index + 1 ];
      const postSeasonDivision = new Division( currentDivision.name, currentDivision.conferenceSize );

      // pull in the promoted competitors from the previous division
      if( prevDivision ) {
        postSeasonDivision.addCompetitors( prevDivision.conferenceWinners.map( ( item: Competitor ) => item.name ) );
        postSeasonDivision.addCompetitors( prevDivision.promotionWinners.map( ( item: Competitor ) => item.name ) );
      }

      // pull in the relegated competitors from the next division
      if( nextDivision ) {
        postSeasonDivision.addCompetitors( nextDivision.relegationBottomfeeders.map( ( item: Competitor ) => item.name ) );
      }

      // pull in the current division's mid table
      postSeasonDivision.addCompetitors( currentDivision.competitors.filter( ( comp: Competitor ) => {
        const directPromoted = currentDivision.conferenceWinners.find( ( winner: Competitor ) => winner.name === comp.name );
        const playoffPromoted = currentDivision.promotionWinners.find( ( winner: Competitor ) => winner.name === comp.name );
        const bottomFeederFound = currentDivision.relegationBottomfeeders.find( ( bottomfeeder: Competitor ) => (
          bottomfeeder.name === comp.name
        ) );

        return directPromoted === undefined
          && playoffPromoted === undefined
          && bottomFeederFound === undefined;
      }).map( ( comp: Competitor ) => comp.name ) );

      // for the bottom division relegation positions have no where to go. so include them too
      if( !prevDivision ) {
        postSeasonDivision.addCompetitors( currentDivision.relegationBottomfeeders.map( ( item: Competitor ) => item.name ) );
      }

      // for the top division the winner has no where to go. so include him too
      if( !nextDivision ) {
        postSeasonDivision.addCompetitors( currentDivision.conferenceWinners.map( ( item: Competitor ) => item.name ) );
      }

      // finally, reassign to the league object's post-season division array
      this.postSeasonDivisions[ index ] = postSeasonDivision;
    });
  }
}

export default League;
