import cheerio from 'cheerio';
import CachedScraper from '../cached-scraper';


/**
 * module-level constants and vars
 */
const BASEURL = 'https://play.esea.net/index.php?';


/**
 * module-level utility functions
 */
function extractCountryCode( str: string ) {
  // /global/images/flags/MD.gif
  const res = str.match( /(.{2})\.gif$/ );
  return res ? res[ 1 ] : null;
}


function extractPlayerId( str: string ) {
  // /users/990809
  const res = str.match( /users\/(.+)$/ );
  return res ? res[ 1 ] : null;
}


function extractTeamId( str: string ) {
  // /teams/8749463
  const res = str.match( /teams\/(.+)$/ );
  return res ? res[ 1 ] : null;
}


/**
 * Class definitions
 */
class ESEA_CSGO_Player {
  // @properties
  public id = '';
  public url = '';
  public name = '';
  public countryurl = '';
  public countrycode = '';

  public build( cheerioctx: CheerioStatic, elem: Cheerio ) {
    const $ = cheerioctx;
    const root = $( elem );
    const playerurl = root.find( 'a' ).next().attr( 'href' ) || '';
    const countryurl = root.find( 'img' ).attr( 'src' ) || '';
    this.id = extractPlayerId( playerurl ) || '';
    this.url = playerurl;
    this.name = root.find( 'a' ).next().html() || '';
    this.countrycode = extractCountryCode( countryurl ) || '';
    this.countryurl = countryurl;
  }
}


class ESEA_CSGO_Team {
  // @properties
  public id = '';
  public url = '';
  public name = '';
  public tag = '';

  public build( cheerioctx: CheerioStatic, elem: Cheerio ) {
    const $ = cheerioctx;
    const root = $( elem );
    const teamname = root.find( 'a' ).attr( 'title' ) || '';
    const teamurl = root.find( 'a' ).attr( 'href' ) || '';
    const teamtag = root.find( 'a' ).html() || '';
    this.id = extractTeamId( teamurl ) || '';
    this.name = teamname;
    this.url = teamurl;
    this.tag = teamtag;
  }
}


/**
 * The main scraper class
 */
interface IterableObject {
  [x: string]: any;
}


export default class ESEA_CSGO_STATSPAGE {
  private scraper: CachedScraper
  private output: any[] = []
  private defaultargs: IterableObject = {
    s: 'stats',
    d: 'overall',
    game_id: 25,
    region_id: 2,
    page: 1,
    sort_dir: 'desc',
    type_scope: 'league',
    type_sub_scope: 'open',
    'period[type]': 'seasons',
    'period[season_start]': 208,
    'period[season_type]': 'regular+season',
  }

  constructor( cachedir: string ) {
    this.scraper = new CachedScraper( cachedir );
    this.scraper.initCacheDir();
  }

  private buildURL( args: IterableObject ) {
    const httpargs = Object
      .keys( args )
      .map( key => `${key}=${args[key]}` )
      .join( '&' )
    ;

    return BASEURL + httpargs;
  }

  private handlerow( cheerioctx: CheerioStatic, elem: CheerioElement ) {
    const $ = cheerioctx;
    const root = $( elem );

    const playercol = root.children( 'td' ).first();
    const player = new ESEA_CSGO_Player();
    player.build( cheerioctx, playercol );

    const teamcol = root.children( 'td' ).first().next();
    const team = new ESEA_CSGO_Team();
    team.build( cheerioctx, teamcol );

    // add the new team+player data
    // to the existing output
    const [ teams, players ] = this.output;
    teams.push( team );
    players.push( player );
  }

  public async generate( args: IterableObject ): Promise<any> {
    // this gets called as a static function from the parent
    // scraper. so make sure to reset the teams on every call
    this.output = [ [], [] ];
    const url = this.buildURL({ ...this.defaultargs, ...args });
    const page = args.page;

    // @todo: scraper not working. recaptcha error.
    // @todo: had to manually get the page html
    const html = await this.scraper.scrape(
      url,
      `esea_csgo_statspage_page${page}_region${args.region_id}`
    );

    // for readability:
    // - use `cheerioctx` when passing as an arg
    // - use `$` for everything else
    const cheerioctx = cheerio.load( html );
    const $ = cheerioctx;

    $( 'header' )
      .filter( ( idx, elem ) => $( elem ).text().match(/Player Ranking/) !== null )
      .parent()
      .find( 'table > tbody > tr' )
      .each( ( idx, elem ) => this.handlerow( cheerioctx, elem ) )
    ;
    return Promise.resolve( this.output );
  }
}
