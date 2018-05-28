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

      // bail on first instance of an unfinished division
      if( !divObj.isGroupStageDone() ) {
        allDone = false;
        break;
      }

      divObj.startPostSeason();
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
      // create a copy of current division if it doesn't exist already
      const newDivision = this.postSeasonDivisions[ index ] || new Division( division.name, division.conferenceSize );

      // bail if top division in the league
      const neighbor = this.divisions[ index + 1 ];

      if( !neighbor ) {
        return;
      }

      // compute TOPN and BOTN
      const TOPN = division.conferenceWinners.length + division.promotionWinners.length;
      const BOTN = Math.ceil( TOPN / neighbor.conferences.length );

      // easy part first, push current division winners into neighbor division
      const newNeighbor = this.postSeasonDivisions[ index + 1 ] || new Division( neighbor.name, neighbor.conferenceSize );
      newNeighbor.addCompetitors( division.conferenceWinners.map( ( comp: Competitor ) => comp.name ) );
      newNeighbor.addCompetitors( division.promotionWinners.map( ( comp: Competitor ) => comp.name ) );

      // now the hard part. pull botn from every conference of our neighbor division
      let bottomfeeders = [];
      neighbor.conferences.forEach( ( conf: Conference, confNum: number ) => {
        const standings = conf.groupObj.results();
        const bottomfeedersStandings = standings.slice( standings.length - BOTN );

        bottomfeedersStandings.forEach( ( groupObj ) => {
          bottomfeeders.push({ confNum, groupObj });
        });
      });

      // if we went over a little bit, sort everyone by points and trim to match TOPN count
      // TODO: sort by pos? points? etc
      if( bottomfeeders.length > TOPN ) {
        bottomfeeders = sortBy( bottomfeeders, bottomfeeder => bottomfeeder.groupObj.pos ).reverse();
        bottomfeeders = bottomfeeders.slice( 0, TOPN );
      }

      // now we can add the bottom feeders to our new division
      newDivision.addCompetitors( bottomfeeders.map( ( bottomfeeder ) => {
        const competitor = neighbor.getCompetitorName( bottomfeeder.confNum, bottomfeeder.groupObj.seed );
        return competitor.name;
      }) );

      // copy mid-table competitors from original neighbor division into new neighbor
      newNeighbor.addCompetitors( neighbor.competitors.filter( ( comp: Competitor ) => {
        // anyone who wasn't moved down (newDivision)
        const botnFound = newDivision.competitors.find( ( botnComp: Competitor ) => botnComp.name === comp.name );

        return botnFound === undefined;
      }).map( ( comp: Competitor ) => comp.name ) );

      // copy mid-table competitors from original division into new division
      newDivision.addCompetitors( division.competitors.filter( ( comp: Competitor ) => {
        // anyone who wasn't moved up (newNeighbor)
        const topnFound = newNeighbor.competitors.find( ( topnComp: Competitor ) => topnComp.name === comp.name );

        return topnFound === undefined;
      }).map( ( comp: Competitor ) => comp.name ) );

      // reassign modified divisions
      this.postSeasonDivisions[ index ] = newDivision;
      this.postSeasonDivisions[ index + 1 ] = newNeighbor;
    });
  }
}

export default League;