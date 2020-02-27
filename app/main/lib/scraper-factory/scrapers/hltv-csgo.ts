import cheerio from 'cheerio';
import CachedScraper from '../cached-scraper';


/**
 * module-level constants and vars
 */
const HLTV_BASEURL = 'https://www.hltv.org';


/**
 * module-level utility functions
 */
function extractCountryCode( str: string ) {
  const res = str.match( /(.{2})\.gif$/ );
  return res ? res[ 1 ] : null;
}


/**
 * Class definitions
 */
export class HLTV_CSGO_Player {
  // @properties
  public id = '';
  public name = '';
  public alias = '';
  public countrycode = '';

  private extractPlayerId( str: string ) {
    const res = str.match( /\/thumb\/(\d+)/ );
    return res ? res[ 1 ] : null;
  }

  public build( cheerioctx: CheerioStatic, elem: Cheerio ) {
    const $ = cheerioctx;
    const name = $( elem ).children( 'img' ).attr( 'alt' );
    const avatarurl = $( elem ).children( 'img' ).attr( 'src' );
    const infobox = $( elem ).children( '.teammate-info' ).children( 'a' );
    const countryurl = $( infobox ).children( 'img' ).attr( 'src' );
    const alias = $( infobox ).children( '.text-ellipsis' ).text();
    this.id = this.extractPlayerId( avatarurl ) || '';
    this.alias = alias;
    this.name = name;
    this.countrycode = extractCountryCode( countryurl ) || '';
  }
}


export class HLTV_CSGO_Team {
  // @properties
  public id = ''
  public name = ''
  public countrycode = ''
  public url = ''
  public players: HLTV_CSGO_Player[] = []

  private extractTeamId( str: string ) {
    const res = str.match( /\/teams\/(\d+)/ );
    return res ? res[ 1 ] : null;
  }

  public build( cheerioctx: CheerioStatic, thisrow: Cheerio ) {
    const $ = cheerioctx;
    const name = $( thisrow ).find( 'a' ).text();
    const countryurl = $( thisrow ).find( 'img' ).attr( 'src' );
    const teamurl = $( thisrow ).find( 'a' ).attr( 'href' );
    this.name = name;
    this.url = HLTV_BASEURL + teamurl;
    this.countrycode = extractCountryCode( countryurl ) || '';
    this.id = this.extractTeamId( teamurl ) || '';
  }

  public buildRoster( cheerioctx: CheerioStatic ) {
    const $ = cheerioctx;
    const rostergrid = $( '.standard-headline' )
      .filter( ( idx, elem ) => $( elem ).text() === 'Current lineup' )
      .parent( 'div' )
      .next( '.grid' )
      .children( '.teammate' )
      .not( '.no-height' )
    ;
    rostergrid.each( ( idx, elem ) => {
      const thisrow = $( elem );
      const player = new HLTV_CSGO_Player();
      player.build( $, thisrow );
      this.players.push( player );
    });
  }
}


/**
 * The main scraper class
 */
export default class HLTV_CSGO {
  // @constants
  private static TEAMS_URL = HLTV_BASEURL + '/stats/teams'

  // @properties
  private scraper: CachedScraper

  constructor( cachedir: string ) {
    this.scraper = new CachedScraper( cachedir );
    this.scraper.initCacheDir();
  }

  private async genteams() {
    // load the teams page into cheerio
    const teamsurl = HLTV_CSGO.TEAMS_URL;
    const html = await this.scraper.scrape( teamsurl, 'hltv_teams' );
    const $ = cheerio.load( html );

    const teams: HLTV_CSGO_Team[] = [];

    // isolate the teams table
    const teamstable = $( '.player-ratings-table > tbody' ).children();

    // build the basic team information
    teamstable.each( ( idx, elem ) => {
      const thisrow = $( elem ).children( '.teamCol-teams-overview' );
      const team = new HLTV_CSGO_Team();
      team.build( $, thisrow );
      teams.push( team );
    });

    // now build the rosters.
    //
    // must wait for all async actions to complete before
    // continuing. so place them in an array of promises.
    const promises = teams.map( async team => {
      const teamhtml = await this.scraper.scrape( team.url, `hltv_team_${team.id}` );
      const inner$ = cheerio.load( teamhtml );
      team.buildRoster( inner$ );
      return Promise.resolve();
    });

    return Promise
      .all( promises )
      .then( () => Promise.resolve( teams ) )
    ;
  }

  public async generate(): Promise<HLTV_CSGO_Team[]> {
    const teams = await this.genteams();
    return Promise.resolve( teams );
  }
}
