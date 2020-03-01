import cheerio from 'cheerio';
import CachedScraper from '../cached-scraper';


/**
 * module-level constants and vars
 */
const LQ_BASEURL = 'https://liquipedia.net/counterstrike/api.php';


/**
 * module-level utility functions
 */
function extractCountryCode( str: string ) {
  // /commons/images/7/7d/Dk_hd.png
  const res = str.match( /(.{2})_hd/ );
  return res ? res[ 1 ] : null;
}


/**
 * Class definitions
 */
class LIQUIPEDIA_CSGO_Player {
  // @properties
  public id = '';
  public name = '';
  public alias = '';
  public countrycode = '';

  public build( cheerioctx: CheerioStatic, elem: CheerioElement ) {
    const $ = cheerioctx;
    const root = $( elem ).children( 'td' );
    const playername = $( root ).next().html();
    const playerlias = $( root )
      .first()
      .children( 'a' )
      .filter( ( idx, a ) => $( a ).children().length <= 0 )
      .html()
    ;
    const countryurl = $( root )
      .find( '.flag' )
      .find( 'img' )
      .attr( 'src' )
    ;

    // bail early if no name could be extracted
    if( !playername || playername.length <= 0 ) {
      return;
    }

    this.countrycode = extractCountryCode( countryurl ) || '';
    this.name = playername || '';
    this.alias = playerlias || '';
  }

  public isvalid() {
    return this.name.length > 0;
  }
}


class LIQUIPEDIA_CSGO_Team {
  // @properties
  public id = '';
  public name = '';
  public logourl = '';
  public countrycode = '';
  public url = '';
  public players: LIQUIPEDIA_CSGO_Player[] = [];

  private extractTeamId( str: string ) {
    // /counterstrike/X6tence
    const res = str.match( /counterstrike\/(.+)$/ );
    return res ? res[ 1 ] : null;
  }

  /**
   * Build team from the provided cheerio element.
   * The cheerio element should be a table where:
   * - 1st row holds the team name+logo
   * - 2nd row holds the player info header
   * - nth row holds player info
   */
  public build( cheerioctx: CheerioStatic, elem: CheerioElement ) {
    const $ = cheerioctx;
    const root = $( elem );

    // get the team name+logo
    const firstrow = $( root ).children( 'tr' ).first();
    const teamurl = $( firstrow ).find( 'a' ).first().attr( 'href' );
    const teamlogo = $( firstrow ).find( 'img' ).attr( 'src' );
    const teamname = $( firstrow )
      .find( 'a' )
      .filter( ( idx, a ) => $( a ).children().length <= 0 )
      .first()
      .html()
    ;

    // get the player rows (+2th row)
    const playerrows = $( root )
      .children( 'tr' )
      .slice( 1 )
      .nextAll()
    ;

    // add each eligible player
    playerrows.each( ( idx, tr ) => {
      const player = new LIQUIPEDIA_CSGO_Player();
      player.build( cheerioctx, tr );

      if( player.isvalid() ) {
        this.players.push( player );
      }
    });

    // build the rest of the team object
    this.id = this.extractTeamId( teamurl ) || '';
    this.name = teamname || '';
    this.url = teamurl || '';
    this.logourl = teamlogo || '';
  }
}


/**
 * The main scraper class
 */
export default class LIQUIPEDIA_CSGO {
  private scraper: CachedScraper
  private teams: LIQUIPEDIA_CSGO_Team[] = [];
  private urls: {[x: string]: string} = {
    eu: 'Portal:Teams/Europe',
    us: 'Portal:Teams/Americas'
  }

  constructor( cachedir: string ) {
    this.scraper = new CachedScraper( cachedir );
    this.scraper.initCacheDir();
  }

  private buildURL( regionid: string ) {
    return (
      LQ_BASEURL
      + '?action=parse&format=json&prop=text&page='
      + this.urls[ regionid ]
    );
  }

  private handleTeamTable( cheerioctx: CheerioStatic, cheerioelem: CheerioElement ) {
    // build the team object
    const team = new LIQUIPEDIA_CSGO_Team();
    team.build( cheerioctx, cheerioelem );
    this.teams.push( team );
  }

  private handleSection( cheerioctx: CheerioStatic, cheerioelem: CheerioElement ) {
    // each section contains multiple team tables.
    const $ = cheerioctx;
    const root = $( cheerioelem ).first();

    // all team data is held within the tbody
    $( root )
      .find( 'table' )
      .children( 'tbody' )
      .each( ( idx, innerelem ) => this.handleTeamTable( cheerioctx, innerelem ) )
    ;
  }

  public async generate( regionid: string ): Promise<LIQUIPEDIA_CSGO_Team[]> {
    // this gets called as a static function from the parent
    // scraper. so make sure to reset the teams on every call
    this.teams = [];

    const url = this.buildURL( regionid );
    const res = await this.scraper.scrape( url, `lq_teams_${regionid}` );
    const html = JSON.parse( res ).parse.text['*'];

    // for readability:
    // - use `cheerioctx` when passing as an arg
    // - use `$` for everything else
    const cheerioctx = cheerio.load( html );
    const $ = cheerioctx;

    /**
     * The data is split up by total prize money in a year. e.g.:
     * - ≥$450,000 Earnings (2019) — 6 teams
     * - ≥$200,000 Earnings (2019) — 4 teams
     *
     * There are no css ids used so the find earnings header
     * element and start crawling up the tree to find the
     * table containing the teams.
     */
    $( '.mw-headline' )
      .filter( ( idx, elem ) => $( elem ).text().match(/Earnings/) !== null )
      .parent()
      .next()
      .each( ( idx, elem ) => this.handleSection( cheerioctx, elem ) )
    ;

    return Promise.resolve( this.teams );
  }
}
