// @flow

import { uniqBy, camelCase } from 'lodash';
import cheerio from 'cheerio';
import type { CheerioElement } from 'cheerio';

import CachedScraper from '../cached-scraper';


class Player {
  id: string;
  username: string;
  countryCode: string;
  teamId: string;
  transferValue: number;
  skillTemplate: string;
  weaponTemplate: string;

  constructor( id: string ) {
    this.id = id;
  }
}

class Team {
  id: string;
  name: string = '';
  url: string;
  placement: number;
  tag: string = '';
  countryCode: string = '';
  division: string = '';
  skillTemplate: string = '';
  squad: Array<Player> = [];

  constructor( url: string, division: string, placement: number ) {
    this.url = url;
    this.division = division;
    this.placement = placement;
    this.id = url.split( '?' )[ 0 ].split( 'teams/' )[ 1 ];
  }
}

class Division {
  id: string;
  url: string;
  name: string = '';
  teams: Array<Team> = [];

  constructor( url: string ) {
    this.url = url;
    this.id = url.split( 'division_id=' )[ 1 ];
  }
}

class Region {
  id: string;
  divisions: Array<Division>;

  constructor( id: string, divisions: Array<Division> ) {
    this.id = id;
    this.divisions = divisions;
  }
}

class ESEA_CSGO {
  // @constants
  BASE_URL: string = 'https://play.esea.net';
  DIVISION_BASE_URL: string = 'index.php?s=league&d=standings&division_id';

  // @properties
  scraperObj: CachedScraper;
  regions: Array<Region>;

  constructor( cacheDir: string ) {
    this.scraperObj = new CachedScraper( cacheDir );
    this.scraperObj.initCacheDir();

    this.regions = [
      new Region(
        'na', [
          new Division( `${this.BASE_URL}/${this.DIVISION_BASE_URL}=2490` ),
          new Division( `${this.BASE_URL}/${this.DIVISION_BASE_URL}=2491` )
        ]
      ),
      new Region(
        'eu', [
          new Division( `${this.BASE_URL}/${this.DIVISION_BASE_URL}=2485` ),
          new Division( `${this.BASE_URL}/${this.DIVISION_BASE_URL}=2505` )
        ]
      )
    ];
  }

  /**
   * Build a unique array of team URLs for the current division object.
   * Modifies the passed in division object and returns it.
   */
  buildDivision = ( divisionObj: Division, data: string ): Division => {
    const $ = cheerio.load( data );
    const teamListElem = $( '#league-standings table tr[class*="row"]' );

    let divisionString = $( '#league-standings section.division h1' ).html();
    divisionString = divisionString.split( 'CS:GO' );

    divisionObj.name = divisionString[ 1 ].trim();

    teamListElem.each( ( counter: number, el: CheerioElement ) => {
      const teamContainerElem = $( el ).children( 'td:nth-child(2)' );
      const teamURL = teamContainerElem.children( 'a:nth-child(2)' ).attr( 'href' );

      divisionObj.teams.push( new Team(
        this.BASE_URL + teamURL.replace( /\./g, '&period[' ),
        divisionObj.name,
        counter
      ) );
    });

    // before returning remove duplicate URLs due to
    // pre and post-seasons
    divisionObj.teams = uniqBy( divisionObj.teams, 'url' );
    return divisionObj;
  }

  /**
   * Build the team object and its squad from the scraped html data.
   * Modified the passed in team object5 and returns it.
   */
  buildTeam = ( teamObj: Team, html: string ) => {
    const $ = cheerio.load( html );
    const profileElem = $( '#teams-profile hr + section' );
    const profileInfoElem = profileElem.children( 'div#profile-info' );
    const teamnameElem = profileElem.children( 'div#profile-header' ).children( 'h1' );
    const profileRosterElem = profileElem.children( 'div#profile-column-right' ).children( 'div.row1' );

    teamObj.name = teamnameElem.text();
    teamObj.tag = profileInfoElem.children( 'div.content' ).children( 'div.data' ).html();

    // Professional = Elite
    // Premier = Expert, Very Hard
    // Main = Hard, Tough
    // Intermediate = Normal, Fair
    // Open = Easy
    switch( teamObj.division ) {
      case 'Professional':
        teamObj.skillTemplate = 'Elite';
        break;
      case 'Premier':
        teamObj.skillTemplate = ( ( teamObj.placement < 3 ) ? 'Expert' : 'Very Hard' );
        break;
      case 'Main':
        teamObj.skillTemplate = ( ( teamObj.placement < 3 ) ? 'Hard' : 'Tough' );
        break;
      case 'Intermediate':
        teamObj.skillTemplate = ( ( teamObj.placement < 3 ) ? 'Normal' : 'Fair' );
        break;
      case 'Amateur':
        teamObj.skillTemplate = 'Easy';
        break;
      default:
        break;
    }

    // TODO: a team may not have a roster. eg: https://goo.gl/DfhSNi
    // TODO: what to do in this case?
    profileRosterElem.each( ( counter: number, el: CheerioElement ) => {
      const countryElem = $( el ).children( 'a' ).children( 'img' );
      const nameElem = $( el ).children( 'a:nth-child(3)' );

      const index = countryElem.attr( 'src' ).indexOf( '.gif' );
      const countryCode = countryElem.attr( 'src' ).substring( index - 2, index );

      // Inherit first player's country code as the team's
      if( counter === 0 ) {
        teamObj.countryCode = countryCode;
      }

      const playerObj = new Player( camelCase( nameElem.text() ) );
      playerObj.username = nameElem.text();
      playerObj.countryCode = teamObj.countryCode;
      playerObj.teamId = teamObj.id;
      playerObj.transferValue = 0; // TODO:
      playerObj.skillTemplate = teamObj.skillTemplate;
      playerObj.weaponTemplate = ( ( counter % 4 === 0 ) ? 'Sniper' : 'Rifle' );

      teamObj.squad.push( playerObj );
    });

    return teamObj;
  }

  generate = async (): Promise<Array<Region>> => {
    const regions = this.regions;

    for( let i = 0; i < regions.length; i++ ) {
      // each region has divisions we must loop through in order
      // to scrape information for itself, the teams, and squads
      const region = regions[ i ];

      for( let j = 0; j < region.divisions.length; j++ ) {
        let divisionObj = region.divisions[ j ];

        // scrape the current division's information and collect
        // its list of teams
        try {
          const content = await this.scraperObj.scrape( divisionObj.url, divisionObj.id );
          divisionObj = this.buildDivision( divisionObj, content );
        } catch( err ) {
          throw err;
        }

        // we have the list of teams for the current division
        // now we need to scrape each team's page and collect information and squad
        const { teams } = divisionObj;

        for( let k = 0; k < teams.length; k++ ) {
          let teamObj = teams[ k ];

          try {
            const content = await this.scraperObj.scrape( teamObj.url, teamObj.id );
            teamObj = this.buildTeam( teamObj, content );
          } catch( err ) {
            throw err;
          }
        }
      }
    }

    return Promise.resolve( this.regions );
  }
}

export default ESEA_CSGO;