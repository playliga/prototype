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

function extractId( str: string ) {
  // /counterstrike/X6tence
  const res = str.match( /counterstrike\/(.+)$/ );
  return res ? res[ 1 ] : null;
}


/**
 * Class definitions
 */
class LIQUIPEDIA_CSGO_Player {
  // @properties
  public id = '';
  public url = '';
  public name = '';
  public alias = '';
  public countryurl = '';
  public countrycode = '';

  public build( cheerioctx: CheerioStatic, elem: CheerioElement ) {
    const $ = cheerioctx;
    const root = $( elem );
    this.url = root.find( 'td > a' ).attr( 'href' ) || '';
    this.id = extractId( this.url ) || '';
    this.countryurl = root.find( 'img' ).attr( 'src' ) || '';
    this.alias = root.find( 'td > a' ).html() || '';
    this.countrycode = extractCountryCode( this.countryurl ) || '';
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

  public build( cheerioctx: CheerioStatic, elem: CheerioElement ) {
    const $ = cheerioctx;
    const root = $( elem );
    const infoelem = root.find( 'center a' );
    const logoelem = root.find( 'table.logo img' );
    const squadelem = root.find( 'table.active > tbody > tr' );

    // basic info
    this.url = infoelem.attr( 'href' ) || '';
    this.logourl = logoelem.attr( 'src' ) || '';
    this.id = extractId( this.url ) || '';
    this.name = infoelem.attr( 'title' ) || '';

    // trim (page does not exist) or
    // (American team) labels from team names
    this.name = this.name.replace( /\(page does not exist\)/, '' );
    this.name = this.name.replace( /\(American team\)/, '' );

    // get players
    squadelem.each( ( idx, tr ) => {
      const player = new LIQUIPEDIA_CSGO_Player();
      player.build( cheerioctx, tr );
      this.players.push( player );
    });

    // inherit the first player's countrycode
    this.countrycode = this.players[0].countrycode;
  }
}


/**
 * The main scraper class
 */
export default class LIQUIPEDIA_CSGO_ESEA {
  private scraper: CachedScraper

  constructor( cachedir: string ) {
    this.scraper = new CachedScraper( cachedir );
    this.scraper.initCacheDir();
  }

  private buildURL( segment: string ) {
    return (
      LQ_BASEURL
      + '?action=parse&format=json&prop=text&page='
      + segment
    );
  }

  private extractSeason( segment: string ) {
    // ESEA/Season_32/Advanced/Europe
    const res = segment.match(/Season_(\d+)/);
    return res ? res[ 1 ] : null;
  }

  private extractRegion( segment: string ) {
    // ESL/Pro_League/Season_10/Europe
    const res = segment.match(/.+\/(.+)$/);
    return res ? res[ 1 ] : null;
  }

  public async generate( segment: string ): Promise<LIQUIPEDIA_CSGO_Team[]> {
    // this gets called as a static function from the parent
    // scraper. so make sure to reset the teams on every call
    const teams: LIQUIPEDIA_CSGO_Team[] = [];
    const url = this.buildURL( segment );
    const region = this.extractRegion( segment );
    const season = this.extractSeason( segment );
    const res = await this.scraper.scrape( url, `lq_teams_eslpro_${season}_${region}` );
    const html = JSON.parse( res ).parse.text['*'];

    // for readability:
    // - use `cheerioctx` when passing as an arg
    // - use `$` for everything else
    const cheerioctx = cheerio.load( html );
    const $ = cheerioctx;

    // div.teamcard-toggle-button > next div sibling
    const daroot = $('div.teamcard-toggle-button' ).nextAll( 'div' ).first();

    $( daroot ).find( 'div.teamcard' ).each( ( idx, elem ) => {
      const team = new LIQUIPEDIA_CSGO_Team();
      team.build( cheerioctx, elem );

      // any teams with `ex-*` prefix will be ignored
      if( team.name.search( /^ex-/i ) < 0 ) {
        teams.push( team );
      }
    });

    return Promise.resolve( teams );
  }
}
