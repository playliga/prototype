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
    this.name = infoelem.html() || '';

    // get players
    squadelem.each( ( idx, tr ) => {
      const player = new LIQUIPEDIA_CSGO_Player();
      player.build( cheerioctx, tr );
      this.players.push( player );
    });
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

  private extractDivisionId( segment: string ) {
    // ESEA/Season_32/Advanced/Europe
    const res = segment.match(/Season_\d+\/(.+)\//);
    return res ? res[ 1 ] : null;
  }

  private extractRegion( segment: string ) {
    // ESEA/Season_32/Advanced/Europe
    const res = segment.match(/.+\/(.+)$/);
    return res ? res[ 1 ] : null;
  }

  public async generate( segment: string ): Promise<LIQUIPEDIA_CSGO_Team[]> {
    // this gets called as a static function from the parent
    // scraper. so make sure to reset the teams on every call
    const teams: LIQUIPEDIA_CSGO_Team[] = [];
    const url = this.buildURL( segment );
    const divisionid = this.extractDivisionId( segment );
    const region = this.extractRegion( segment );
    const res = await this.scraper.scrape( url, `lq_teams_esea_${divisionid}_${region}` );
    const html = JSON.parse( res ).parse.text['*'];

    // for readability:
    // - use `cheerioctx` when passing as an arg
    // - use `$` for everything else
    const cheerioctx = cheerio.load( html );
    const $ = cheerioctx;

    $( 'div.teamcard' ).each( ( idx, elem ) => {
      const team = new LIQUIPEDIA_CSGO_Team();
      team.build( cheerioctx, elem );
      teams.push( team );
    });

    return Promise.resolve( teams );
  }
}
